import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { PollDescriptor, ChoiceDescriptor } from "./app";
import JimmyPoll from "./app"

export const FONT = MRE.TextFontFamily.Cursive;
export const HELP_BUTTON_POSITION = { x: 1.74, y: 0.6, z: 0 }; // bottom right corner of the screen

const SCREEN_HEIGHT = 1.5;
const SCREEN_SCALE = 0.5;

const BACKGROUND_IMAGES = ["tile01.png", "tile02.png", "tile03.png", "tile04.png", "tile05.png", "tile06.png", "tile07.png", "tile08.png", "tile09.png"];
const BACKGROUND_TEXTURE_SCALE = {x: 4, y: 2} // sets how often the pattern repeats--bigger is more tiles. Tiles are square but screen is ~2:1
const BACKGROUND_WIDTH = 7.8;
const BACKGROUND_HEIGHT = 4.38;
const BACKGROUND_DEPTH = 0.02;

const DEBUG = false;

let backgroundImage : string;
let backgroundImageBrightness = 0.3; // remember to update the README

// hosts can choose a background
// hosts can also adjust the brightness
export function chooseBackgroundImage(params: MRE.ParameterSet){
  let index = Number(params.bg);
  let total = BACKGROUND_IMAGES.length;
  let brightness = Number(params.brt)

  if(index > 0 && index < total)
    backgroundImage = BACKGROUND_IMAGES[index-1];
  else // randomly choose one by default
    backgroundImage = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];

  if(brightness > 0 && brightness < 1)
    backgroundImageBrightness = brightness;
}

export function updateHeader(header: MRE.Actor, style: string, text: string){
  header.text.contents = text;

  switch (style) {
    case 'Title': // big and centered vertically and horizontally on the screen
      header.text.height = 0.4;
      header.text.anchor = MRE.TextAnchorLocation.MiddleCenter;
      header.text.justify = MRE.TextJustify.Center;
      header.transform.local.position = new MRE.Vector3(0, 1.5, 0);
      break;
    case 'Results': // scalable, centered, at the top of the screen
      // scale the height based on the number of characters
      let chars = text.length; // accounting for "Poll: ?"

      if(chars < 20){
        header.text.height = 0.3;
      }
      else if(chars < 25) {
        header.text.height = 0.25;
      }
      else if(chars < 30) {
        header.text.height = 0.2;
      }
      else{ // any smaller and it'll be hard to read
        header.text.height = 0.15;
      }

      header.text.anchor = MRE.TextAnchorLocation.MiddleCenter;
      header.text.justify = MRE.TextJustify.Center;
      header.transform.local.position = new MRE.Vector3(0, 2.4, 0);
      break;
    default:
      break;
  }
  if(DEBUG){ console.log(`Header height: ${header.text.height}`) }
}

export function recreateChoices(app: JimmyPoll, choices: MRE.Actor) : MRE.Actor {
  if(choices)
    choices.destroy();

  const actor = MRE.Actor.Create(app.context, {
    actor: {
      name: 'Choices',
      transform: { local: { position: { x: -1.6, y: 2, z: 0 } } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
      text: {
        contents: null,
        height: null,
        anchor: MRE.TextAnchorLocation.MiddleCenter,
        justify: MRE.TextJustify.Center,
        font: FONT
      }
    }
  });

  return actor;
}

export function updateChoices(app: JimmyPoll, poll: PollDescriptor, choices: MRE.Actor) : MRE.Actor [] {

  let buttons : MRE.Actor[] = [];
  let y = -0.2;
  const buttonSpacing = 0.3;
  const choiceSpacing = 0.2;

  for(let i = 0; i < poll.choices.length; i++){
    let button = MRE.Actor.CreateFromLibrary(app.context, {
      resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        name: 'Screen Button',
        transform: { local: { position: { x: 0, y: y, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        parentId: choices.id
      }
    });

    buttons.push(button);

    let label = MRE.Actor.Create(app.context, {
      actor: {
        transform: { local: { position: { x: choiceSpacing, y: 0, z: 0 } } },
        text: {
          contents: poll.choices[i].name,
          height: 0.2,
          anchor: MRE.TextAnchorLocation.MiddleLeft,
          justify: MRE.TextJustify.Left,
          font: FONT
        },
        parentId: button.id
      }
    });

    y -= buttonSpacing;

  }
  return buttons;
}

export function updateResults(app: JimmyPoll, poll: PollDescriptor, choices: MRE.Actor){
  let total = poll.choices.reduce((sum, current) => sum + current.userIds.size, 0);
  let y = 0;
  let buttonSpacing = 0;

  // space out the buttons vertically based on the number of choices
  switch (poll.choices.length){
    case 2:
      y = -0.3;
      buttonSpacing = 0.5;
      break;
    case 3:
      y = -0.15;
      buttonSpacing = 0.5;
      break;
    case 4:
      y = -0.05;
      buttonSpacing = 0.4;
      break;
    case 5:
      y = 0.07;
      buttonSpacing = 0.35;
      break;
    case 6:
      y = 0.05;
      buttonSpacing = 0.3;
      break;
  }

  if(DEBUG){ console.log(`y: ${y}, buttonSpacing: ${buttonSpacing}`) }

  for(let i = 0; i < poll.choices.length; i++){
    let votes = poll.choices[i].userIds.size;
    let percentage = Math.round(votes / total * 100);
    let button = choices.children[i];
    let label = choices.children[i].children[0];
    if(total > 0){ // don't add percentages until there are votes
      label.text.contents = `${percentage}%  ${poll.choices[i].name} (${votes})\n`;
    }
    button.transform.local.position.y = y;
    y -= buttonSpacing;
  }

}

export function createScreen(app: JimmyPoll) : MRE.Actor{
  const screen = MRE.Actor.CreateFromLibrary(app.context, {
    resourceId: 'artifact:1338743673998803669', // https://account.altvr.com/kits/1329955493782749272/artifacts/1338743673998803669
    actor: {
      name: 'Screen',
      transform: { local: { position: { x: 0, y: SCREEN_HEIGHT, z: 0.1 }, scale: {x: SCREEN_SCALE, y: SCREEN_SCALE, z: 1} } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
    }
   });

  // add some background pattern
  if(DEBUG)
    console.log(`Background: ${backgroundImage}, brightness: ${backgroundImageBrightness}`);

  const backgroundTexture = app.assets.createTexture("bgTex", { uri: backgroundImage } );

  const backgroundMaterial = app.assets.createMaterial("bgMat", {
    mainTextureId: backgroundTexture.id,
    mainTextureScale: BACKGROUND_TEXTURE_SCALE,
    emissiveTextureId: backgroundTexture.id,
    emissiveTextureScale: BACKGROUND_TEXTURE_SCALE,
    emissiveColor: new MRE.Color3(backgroundImageBrightness, backgroundImageBrightness, backgroundImageBrightness)
  });

  // background
  MRE.Actor.Create(app.context, {
    actor: {
      transform: { local: { position: { x: 0, y: 0, z: -BACKGROUND_DEPTH } } }, // -Z is towards you when looking at the screen
      appearance: {
          meshId: app.assets.createBoxMesh("cube", BACKGROUND_WIDTH, BACKGROUND_HEIGHT, BACKGROUND_DEPTH).id, // X is width, Y is height, Z is depth when looking at screen
          materialId: backgroundMaterial.id
      },
      parentId: screen.id
    }
  });

  return screen;
}

export function createHeader(app: JimmyPoll) : MRE.Actor{
  const header = MRE.Actor.Create(app.context, {
    actor: {
      name: 'Header',
      transform: { local: { position: { x: 0, y: 0, z: 0 } } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
      text: {
        contents: null,
        height: null,
        anchor: MRE.TextAnchorLocation.MiddleCenter,
        justify: MRE.TextJustify.Center,
        font: FONT
      }
    }
  });
  return header;
}

export function createHelpButton(app: JimmyPoll) : MRE.Actor {
  let text = `Take a poll!\n\nWhen a poll starts you'll hear a sound and see choices on the screen.\n\nYou can vote by clicking the button next to your choice. You may change your vote as often as you'd like.\n\nOnce the first vote is in, results will update on the screen live.\n\nLearn more at github.com/tuesy/jimmypoll`;

  const button = MRE.Actor.CreateFromLibrary(app.context, {
    resourceId: 'artifact:1579238405710021245',
    actor: {
      name: 'Help Button',
      transform: { local: { position: HELP_BUTTON_POSITION } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
    }
   });
  button.setBehavior(MRE.ButtonBehavior).onClick(user => {
    user.prompt(text).then(res => {
        if(res.submitted){
          // clicked 'OK'
        }
        else{
          // clicked 'Cancel'
        }
    })
    .catch(err => {
      console.error(err);
    });
  });

  return button;
}

