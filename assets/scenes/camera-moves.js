import { mountScene } from "../scene.js";

var moves = {
  dolly: {title:"Наїзд (dolly in)", prompt:"Камера плавно наближається до персонажа, фон змінює перспективу."},
  dollyOut: {title:"Від'їзд (dolly out)", prompt:"Камера віддаляється від персонажа, відкриваючи більше простору навколо."},
  pan: {title:"Панорама (pan)", prompt:"Камера повертається ліворуч праворуч, залишаючись на одному місці."},
  orbit: {title:"Обліт (orbit)", prompt:"Камера рухається дугою навколо персонажа, показуючи різні боки сцени."},
  crane: {title:"Підйом (crane)", prompt:"Камера піднімається над персонажем і відкриває сцену згори."},
  zoom: {title:"Зум (zoom)", prompt:"Камера залишається на місці, але змінює фокусну відстань."},
  tracking: {title:"Слідування (tracking)", prompt:"Камера рухається поруч із персонажем, утримуючи його в кадрі."}
};

var sceneApi;
window.CameraScene = {
  playMove:function(move){ if (sceneApi) sceneApi.playMove(move); },
  moves:moves
};
var controlList = [
  ["dolly","Наїзд"],["dollyOut","Від'їзд"],["pan","Панорама"],["orbit","Обліт"],
  ["crane","Підйом"],["zoom","Зум"],["tracking","Слідування"]
].map(function(pair){
  return {
    move: pair[0],
    label: pair[1],
    onClick: function(state){ state.playMove(pair[0]); }
  };
});

var sceneElement = document.querySelector("#camera .camera-scene");
var descriptionElement = document.getElementById("camera-move-description");

mountScene(sceneElement, {
  describe: "На сцені є фігура людини, дерева й будинки. Наїзд рухає камеру до фігури, зум змінює кут огляду з тієї самої точки, панорама повертає камеру на місці, а обліт переносить її навколо фігури.",
  controls: controlList,
  onMove: function(move){
    var item = moves[move];
    if (descriptionElement && item) descriptionElement.innerHTML = "<b>" + item.title + ".</b> " + item.prompt;
  },
  setup: function(ctx){
    var THREE = ctx.THREE;
    ctx.scene.background = new THREE.Color("#dff5f5");
    ctx.camera.position.set(0, 3.2, 8);
    ctx.camera.lookAt(0, 1, 0);

    ctx.scene.add(new THREE.HemisphereLight(0xffffff, 0x637b86, 2));
    var sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-4, 8, 5);
    ctx.scene.add(sun);
    function box(width,height,depth,color,x,y,z){
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth), new THREE.MeshStandardMaterial({color:color}));
      mesh.position.set(x,y,z);
      ctx.scene.add(mesh);
      return mesh;
    }
    box(30,0.2,20,0x93bd8e,0,-0.15,0);
    box(1.7,1.35,1.2,0xe6a45e,-3,0.68,-2);
    box(1.7,1.35,1.2,0xe6a45e,3,0.68,-2);
    box(1.9,1.4,1.5,0xe6a45e,0,0.7,-4);
    var roofMaterial = new THREE.MeshStandardMaterial({color:0x9b5b54});
    [[-3,1.55,-2],[3,1.55,-2],[0,1.6,-4]].forEach(function(pos){
      var roof = new THREE.Mesh(new THREE.ConeGeometry(1.25,0.85,4), roofMaterial);
      roof.position.set(pos[0],pos[1],pos[2]);
      roof.rotation.y = Math.PI / 4;
      ctx.scene.add(roof);
    });
    [-6,-4.5,4.7,6].forEach(function(x,index){
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.18,1,6), new THREE.MeshStandardMaterial({color:0x76513b}));
      trunk.position.set(x,0.5,-1-index%2);
      ctx.scene.add(trunk);
      var crown = new THREE.Mesh(new THREE.ConeGeometry(0.8,1.8,7), new THREE.MeshStandardMaterial({color:0x377a59}));
      crown.position.set(x,1.8,-1-index%2);
      ctx.scene.add(crown);
    });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.34,1,8), new THREE.MeshStandardMaterial({color:0x315d9b}));
    body.position.set(0,0.82,0);
    ctx.scene.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8), new THREE.MeshStandardMaterial({color:0xf0c39b}));
    head.position.set(0,1.5,0);
    ctx.scene.add(head);
    var legs = box(0.16,0.65,0.18,0x273b4d,-0.16,0.3,0);
    var legRight = box(0.16,0.65,0.18,0x273b4d,0.16,0.3,0);
    var arm = box(0.72,0.15,0.17,0xe2ad83,0.42,1.02,0);
    var state = {
      body:body, head:head, legs:[legs,legRight], arm:arm,
      move:"", timer:0,
      playMove:function(move){
        this.move = move;
        this.timer = 0;
        if (this.requestRender) this.requestRender();
      }
    };
    sceneApi = state;
    return state;
  },
  update: function(ctx,state,dt){
    if (!state.move) return false;
    state.timer = Math.min(1, state.timer + dt / 2.5);
    var progress = Math.sin(state.timer * Math.PI);
    var x = 0, y = 3.2, z = 8, targetX = 0, targetY = 1, fov = 48;
    if (state.move === "dolly") z = 8 - 3.2 * progress;
    if (state.move === "dollyOut") z = 8 + 4 * progress;
    if (state.move === "pan") targetX = 2.8 * progress;
    if (state.move === "orbit"){
      var angle = state.timer * Math.PI * 2;
      x = Math.sin(angle) * 8;
      z = Math.cos(angle) * 8;
    }
    if (state.move === "crane"){ y = 3.2 + 3 * progress; targetY = 0.5; }
    if (state.move === "zoom") fov = 48 - 19 * progress;
    if (state.move === "tracking"){
      var characterX = -2.3 * progress;
      targetX = characterX;
      state.body.position.x = characterX;
      state.head.position.x = characterX;
      state.legs[0].position.x = characterX - 0.16;
      state.legs[1].position.x = characterX + 0.16;
      state.arm.position.x = characterX + 0.42;
      x = characterX;
    }else{
      state.body.position.x = 0;
      state.head.position.x = 0;
      state.legs[0].position.x = -0.16;
      state.legs[1].position.x = 0.16;
      state.arm.position.x = 0.42;
    }
    ctx.camera.position.set(x,y,z);
    ctx.camera.lookAt(targetX,targetY,0);
    if (ctx.camera.fov !== fov){ ctx.camera.fov = fov; ctx.camera.updateProjectionMatrix(); }
    if (state.timer >= 1) state.move = "";
    return !!state.move;
  }
});
