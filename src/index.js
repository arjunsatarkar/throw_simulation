import RAPIER from "./rapier.es.js";

const objElement = document.querySelector("div#throwable");

const queryParams = new URLSearchParams(window.location.search);
const image = queryParams.get("image");
if (image !== null) {
  objElement.style.backgroundImage = `url(${decodeURI(image)})`;
}

RAPIER.init().then(() => {
  const CLICK_IMPULSE_MULTIPLIER = 300_000;
  const GRAVITY = { x: 0.0, y: 2000 };
  const LINEAR_DAMPING = 0.5;
  const OBJ_BASE_RADIUS = 30;
  const OBJ_BASE_SIZE = { x: OBJ_BASE_RADIUS * 2, y: OBJ_BASE_RADIUS * 2 };
  const OBJ_MASS = 100;
  const STEP_MS = 33;
  const TARGET_WIDTH_FACTOR = 0.05;
  const VIEWPORT_SIZE = {
    x: document.documentElement.clientWidth,
    y: document.documentElement.clientHeight,
  };
  const WIDTH_JUMP_FACTOR = 5;

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
  world.createCollider(
    RAPIER.ColliderDesc.ball(OBJ_BASE_RADIUS).setMass(OBJ_MASS),
    obj,
  );

  const objSize = {
    x: OBJ_BASE_SIZE.x,
    y: OBJ_BASE_SIZE.y,
  };
  let objVelocityLastFrame = null;

  let mainLoop = () => {
    world.step();

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
