import RAPIER from "./rapier.es.js";

const CLICK_IMPULSE_MULTIPLIER = 300_000;
const GRAVITY = { x: 0.0, y: 2000 };
const LINEAR_DAMPING = 0.5;
const OBJ_BASE_RADIUS = 30;
const OBJ_BASE_SIZE = { x: OBJ_BASE_RADIUS * 2, y: OBJ_BASE_RADIUS * 2 };
const OBJ_MASS = 100;
const SCORE_DECAY_CURVE_L = 1000;
const SCORE_DECAY_CURVE_K = 0.01;
const SCORE_DECAY_CURVE_X0 = 1000;
const SCORE_INCREMENT = 150;
const STEP_MS = 33;
const TARGET_WIDTH_FACTOR = 0.05;
const VIEWPORT_SIZE = {
  x: document.documentElement.clientWidth,
  y: document.documentElement.clientHeight,
};
const WIDTH_JUMP_FACTOR = 5;

const objElement = document.querySelector("#throwable");

const queryParams = new URLSearchParams(window.location.search);
const image = queryParams.get("image");
if (image !== null) {
  objElement.style.backgroundColor = "white";
  objElement.style.backgroundImage = `url(${decodeURI(image)})`;
}

const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");

RAPIER.init().then(() => {
  let world = new RAPIER.World(GRAVITY);

  const wallColliderDescs = {
    x: RAPIER.ColliderDesc.cuboid(VIEWPORT_SIZE.x, 1).setRestitution(1),
    y: RAPIER.ColliderDesc.cuboid(1, VIEWPORT_SIZE.y).setRestitution(1),
  };
  world.createCollider(wallColliderDescs.x);
  world.createCollider(wallColliderDescs.x.setTranslation(0, VIEWPORT_SIZE.y));
  world.createCollider(wallColliderDescs.y);
  world.createCollider(wallColliderDescs.y.setTranslation(VIEWPORT_SIZE.x, 0));

  let objRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(VIEWPORT_SIZE.x / 2, VIEWPORT_SIZE.y / 3)
    .setLinearDamping(LINEAR_DAMPING)
    .setCcdEnabled(true);
  let obj = world.createRigidBody(objRigidBodyDesc);
  let objColliderDesc = RAPIER.ColliderDesc.ball(OBJ_BASE_RADIUS)
    .setMass(OBJ_MASS)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  world.createCollider(objColliderDesc, obj);

  const objSize = {
    x: OBJ_BASE_SIZE.x,
    y: OBJ_BASE_SIZE.y,
  };
  let objVelocityLastFrame = null;
  let lastCollision = { handle1: null, handle2: null };
  let score = 0;
  let highScore = score;
  let lastScoredAt = performance.now();

  let mainLoop = () => {
    let eventQueue = new RAPIER.EventQueue(true);

    world.step(eventQueue);

    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      if (
        started &&
        (handle1 !== lastCollision.handle1 || handle2 !== lastCollision.handle2)
      ) {
        score += SCORE_INCREMENT;
        if (score > highScore) {
          highScore = score;
        }
        lastScoredAt = performance.now();
      }
      lastCollision = { handle1: handle1, handle2: handle2 };
    });

    const score_gap = performance.now() - lastScoredAt;
    const score_decay_coefficient =
      SCORE_DECAY_CURVE_L -
      SCORE_DECAY_CURVE_L /
        (1 + Math.exp(-SCORE_DECAY_CURVE_K * (score - SCORE_DECAY_CURVE_X0)));
    if (score_gap > score_decay_coefficient) {
      score -= Math.max(Math.log(score), 1);
      score = Math.max(score, 0);
    }

    scoreElement.textContent = `${Math.round(score)}`;
    highScoreElement.textContent = `${Math.round(highScore)}`;

    const objPosition = obj.translation();
    objElement.style.left = `${objPosition.x}px`;
    objElement.style.top = `${objPosition.y}px`;

    const objVelocity = obj.linvel();
    if (objVelocityLastFrame !== null) {
      // Just delta velocity across a frame, technically
      const objAcceleration = {
        x: objVelocity.x - objVelocityLastFrame.x,
        y: objVelocity.y - objVelocityLastFrame.y,
      };
      let targetWidth =
        OBJ_BASE_SIZE.x + TARGET_WIDTH_FACTOR * Math.abs(objAcceleration.y);
      let targetHeight =
        OBJ_BASE_SIZE.y + TARGET_WIDTH_FACTOR * Math.abs(objAcceleration.x);

      objSize.x = objSize.x + (targetWidth - objSize.x) / WIDTH_JUMP_FACTOR;
      objSize.y = objSize.y + (targetHeight - objSize.y) / WIDTH_JUMP_FACTOR;
    }
    objVelocityLastFrame = objVelocity;

    objElement.style.width = `${objSize.x}px`;
    objElement.style.height = `${objSize.y}px`;

    setTimeout(mainLoop, STEP_MS);
  };

  document.addEventListener("click", (e) => {
    const clickPosition = { x: e.clientX, y: e.clientY };
    const objPosition = obj.translation();
    const direction = {
      x: clickPosition.x - objPosition.x,
      y: clickPosition.y - objPosition.y,
    };
    const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    obj.setLinvel({ x: 0, y: 0 });
    if (distance > 0) {
      obj.applyImpulse(
        {
          x: (direction.x * CLICK_IMPULSE_MULTIPLIER) / distance,
          y: (direction.y * CLICK_IMPULSE_MULTIPLIER) / distance,
        },
        true,
      );
    }
  });

  mainLoop();
});
