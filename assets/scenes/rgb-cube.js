import { mountScene } from "../scene.js";

var SIZE = 2;
var pending = {r:0, g:0, b:0};
var sceneApi = null;

function num(v){
  var n = typeof v === "number" ? v : parseFloat(v);
  return isFinite(n) ? Math.min(255, Math.max(0, Math.round(n))) : 0;
}

function applyColor(state, color){
  var r = num(color.r), g = num(color.g), b = num(color.b);
  state.ball.position.set((r / 255 - 0.5) * SIZE, (g / 255 - 0.5) * SIZE, (b / 255 - 0.5) * SIZE);
  state.ball.material.color.setRGB(r / 255, g / 255, b / 255);
  if (state.requestRender) state.requestRender();
}

mountScene(".rgb-scene", {
  describe: "Куб RGB: три осі — червона (R), зелена (G) і синя (B), кожна від 0 до 255. Кулька всередині куба показує поточний колір: що більше значення каналу, то далі кулька від початку осі. Чорний колір у кутку 0, 0, 0, білий — у протилежному кутку.",
  controls: [
    {move:"rotate", label:"Обертати", onClick:function(state){ state.rotating = !state.rotating; }},
    {move:"reset", label:"Скинути вигляд", onClick:function(state){
      state.rotating = false;
      state.group.rotation.y = 0;
    }}
  ],
  setup: function(ctx){
    var THREE = ctx.THREE;
    ctx.scene.background = new THREE.Color("#1d2333");
    ctx.camera.position.set(3.6, 3.0, 3.6);
    ctx.camera.lookAt(0, 0, 0);

    var group = new THREE.Group();
    ctx.scene.add(group);
    var h = SIZE / 2;

    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE, SIZE, SIZE)),
      new THREE.LineBasicMaterial({color:0x8d96ad})
    );
    group.add(edges);

    // Осі з кута (0,0,0): R — x (червона), G — y (зелена), B — z (синя).
    var o = -h;
    var axes = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([
        o,o,o, h,o,o,  o,o,o, o,h,o,  o,o,o, o,o,h
      ], 3)).setAttribute("color", new THREE.Float32BufferAttribute([
        1,0.2,0.2, 1,0.2,0.2,  0.2,1,0.2, 0.2,1,0.2,  0.3,0.5,1, 0.3,0.5,1
      ], 3)),
      new THREE.LineBasicMaterial({vertexColors:true})
    );
    group.add(axes);

    var ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 16),
      new THREE.MeshBasicMaterial({color:0x000000})
    );
    group.add(ball);

    var state = {group:group, ball:ball, rotating:false};
    applyColor(state, pending);
    sceneApi = state;
    return state;
  },
  update: function(ctx, state, dt){
    if (!state.rotating) return false;
    state.group.rotation.y += dt * 0.6;
    return true;
  }
}).then(function(mounted){
  if (!mounted) return;
  window.RgbCube = {
    setColor: function(color){
      pending = {r:num(color && color.r), g:num(color && color.g), b:num(color && color.b)};
      applyColor(sceneApi, pending);
    }
  };
});
