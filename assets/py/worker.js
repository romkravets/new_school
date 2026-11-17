/* Web Worker: Pyodide з CDN, виконання коду учня зі змінними з vars.
   Протокол: in {id, code, vars}; out {id, stdout, error} або {type:"status", status:"loading"|"ready"|"failed", message?}. */
"use strict";

var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
var pyodide = null;

function status(s, message) { self.postMessage({ type: "status", status: s, message: message }); }

var loading = (function () {
  status("loading");
  try {
    importScripts(PYODIDE_URL);
  } catch (e) {
    status("failed", "не вдалося завантажити Pyodide");
    return Promise.resolve(false);
  }
  return self.loadPyodide().then(function (p) {
    pyodide = p;
    status("ready");
    return true;
  }, function (e) {
    status("failed", String(e && e.message || e));
    return false;
  });
})();

var INPUT_MSG = "input() тут не працює: дані вже є у змінних";

self.onmessage = function (ev) {
  var m = ev.data;
  loading.then(function (ok) {
    if (!ok) return;
    var out = "", err = null, g = null, jsvars = null;
    // write-режим віддає байти як є (без втрати кінцевого неповного рядка, на відміну від batched)
    var dec = new TextDecoder();
    var collect = { write: function (buf) { out += dec.decode(buf, { stream: true }); return buf.length; } };
    try {
      pyodide.setStdout(collect);
      pyodide.setStderr(collect);
      g = pyodide.globals.get("dict")();
      jsvars = pyodide.toPy(m.vars || {});
      g.update(jsvars);
      g.set("__name__", "__main__");
      var guard = pyodide.runPython(
        "def _input_blocked(*a, **k):\n    raise RuntimeError(" + JSON.stringify(INPUT_MSG) + ")\n_input_blocked",
        { globals: pyodide.globals.get("dict")() }
      );
      g.set("input", guard);
      guard.destroy();
      pyodide.runPython(String(m.code), { globals: g });
    } catch (e) {
      err = String(e && e.message || e);
    } finally {
      try { pyodide.runPython("import sys\nsys.stdout.flush()\nsys.stderr.flush()"); } catch (e2) {}
      if (jsvars && jsvars.destroy) jsvars.destroy();
      if (g) g.destroy();
    }
    self.postMessage({ id: m.id, stdout: out, error: err });
  });
};
