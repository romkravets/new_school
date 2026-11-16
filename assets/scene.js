function showFallback(target, fallback, description, message){
  if (fallback) fallback.hidden = false;
  var status = target.parentElement.querySelector("[data-scene-status]");
  if (status){
    status.textContent = message || description;
    status.hidden = false;
  }
}

export async function mountScene(selector, config){
  var target = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!target) throw new Error("Не знайдено контейнер 3D-сцени: " + selector);
  var fallback = target.parentElement.querySelector(".scene-fallback");
  if (location.protocol === "file:"){
    showFallback(target, fallback, config.describe, "3D-сцена потребує http(s). Нижче показано її текстовий опис.");
    return null;
  }

  var THREE;
  try{
    THREE = await import("three");
  }catch(error){
    console.error("Не вдалося завантажити three.js для сцени.", error);
    showFallback(target, fallback, config.describe, "Не вдалося завантажити 3D-сцену. Скористайтеся текстовим описом нижче.");
    return null;
  }

  var probe = document.createElement("canvas");
  var webgl = probe.getContext("webgl2") || probe.getContext("webgl");
  if (!webgl){
    showFallback(target, fallback, config.describe, "Браузер не підтримує WebGL. Скористайтеся текстовим описом сцени.");
    return null;
  }

  var renderer;
  try{
    renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  }catch(error){
    console.error("Не вдалося створити WebGL-рендерер.", error);
    showFallback(target, fallback, config.describe, "Не вдалося запустити WebGL. Скористайтеся текстовим описом сцени.");
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "scene-canvas";
  target.appendChild(renderer.domElement);

  var context = {
    THREE: THREE,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(48, 1, 0.1, 100),
    renderer: renderer,
    el: target
  };
  var state;
  try{
    state = config.setup(context);
  }catch(error){
    console.error("Не вдалося створити вміст 3D-сцени.", error);
    renderer.dispose();
    renderer.domElement.remove();
    showFallback(target, fallback, config.describe, "Не вдалося створити 3D-сцену. Скористайтеся її описом.");
    return null;
  }

  var description = document.createElement("p");
  description.className = "scene-description";
  description.textContent = config.describe;
  target.appendChild(description);
  var controls = document.createElement("div");
  controls.className = "scene-controls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Керування рухом камери");
  (config.controls || []).forEach(function(control){
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn ghost";
    button.textContent = control.label;
    button.addEventListener("click", function(){
      control.onClick(state, context);
      if (config.onMove) config.onMove(control.move);
      resume();
    });
    controls.appendChild(button);
  });
  target.appendChild(controls);
  if (fallback) fallback.hidden = true;
  var status = target.parentElement.querySelector("[data-scene-status]");
  if (status) status.hidden = true;

  var visible = !("IntersectionObserver" in window);
  var frame = 0;
  var previousTime = 0;
  function resize(){
    var width = Math.max(1, target.clientWidth);
    var height = Math.max(1, Math.round(width * 0.56));
    renderer.setSize(width, height, false);
    context.camera.aspect = width / height;
    context.camera.updateProjectionMatrix();
  }
  function renderFrame(time){
    frame = 0;
    if (document.visibilityState !== "visible" || !visible) return;
    var delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    var animate = config.update ? config.update(context, state, delta) : false;
    renderer.render(context.scene, context.camera);
    if (animate) frame = window.requestAnimationFrame(renderFrame);
    else previousTime = 0;
  }
  function resume(){
    if (!frame && document.visibilityState === "visible" && visible){
      previousTime = 0;
      frame = window.requestAnimationFrame(renderFrame);
    }
  }
  function pause(){
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
  state.requestRender = resume;
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(target);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if (visible) resume(); else pause();
    }).observe(target);
  }
  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState === "visible") resume(); else pause();
  });
  window.addEventListener("pagehide", function(){
    pause();
    renderer.dispose();
  }, {once:true});
  resume();
  return {context:context, state:state, renderer:renderer};
}
