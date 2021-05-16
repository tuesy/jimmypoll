import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { PollDescriptor, PollChoiceDescriptor } from "./app";

export const HELP_BUTTON_POSITION = { x: 1.74, y: 0.6, z: 0 }; // bottom right corner of the screen

const WELCOME_TEXT = 'Poll App';
const INFO_TEXT_HEIGHT = 1.6;

const SCREEN_HEIGHT = 1.5;
const SCREEN_SCALE = 0.5;

const APP_TITLE_HEIGHT = 0.4;
const UPDATE_POLL_HEIGHT = 0.3;
const FONT = MRE.TextFontFamily.Cursive;

const BACKGROUND_IMAGES = ["tile01.png", "tile02.png", "tile03.png", "tile04.png", "tile05.png", "tile06.png", "tile07.png", "tile08.png", "tile09.png"];
const BACKGROUND_TEXTURE_SCALE = {x: 4, y: 2} // sets how often the pattern repeats--bigger is more tiles. Tiles are square but screen is ~2:1
const BACKGROUND_WIDTH = 7.8;
const BACKGROUND_HEIGHT = 4.38;
const BACKGROUND_DEPTH = 0.02;

const DEBUG = false;

let backgroundImage : string;
export let infoText : MRE.Actor;

export function create(context: MRE.Context, assets: MRE.AssetContainer){
  createScreen(context, assets);
  createHelpButton(context, assets);
}

export function pollStarted(context: MRE.Context, assets: MRE.AssetContainer, poll: PollDescriptor){
  infoText.transform.local.position.x = 0;
  infoText.text.height = 0.2;
  infoText.text.anchor = MRE.TextAnchorLocation.MiddleCenter;
  infoText.text.justify = MRE.TextJustify.Center;
  infoText.text.contents = `Poll: ${poll.name}`;
}

export function updateResults(context: MRE.Context, assets: MRE.AssetContainer, poll: PollDescriptor){
  let total = poll.choices.reduce((sum, current) => sum + current.userIds.size, 0);
  let display = `Poll: ${poll.name}\n`;
  for(let i = 0; i < poll.choices.length; i++){
    let votes = poll.choices[i].userIds.size;
    let percentage = Math.round(votes / total * 100);
    display += `${percentage}%  ${poll.choices[i].name} (${votes})\n`;
  }

  infoText.transform.local.position.x = -1;
  infoText.text.height = UPDATE_POLL_HEIGHT;
  infoText.text.anchor = MRE.TextAnchorLocation.MiddleLeft;
  infoText.text.justify = MRE.TextJustify.Left;
  infoText.text.contents = display;

  // make it smaller so we can see all the results
  if(poll.choices.length > 3){
    infoText.text.height = 0.2;
    infoText.transform.local.position.x = -1.5;
  }
  else{
    infoText.text.height = 0.3;
    infoText.transform.local.position.x = -1.5;
  }
}

// hosts can choose a background
export function chooseBackgroundImage(params: any){
  let index = Number(params.bg);
  let total = BACKGROUND_IMAGES.length;
  if(index > 0 && index < total)
    backgroundImage = BACKGROUND_IMAGES[index-1];
  else // randomly choose one by default
    backgroundImage = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
}

function createScreen(context: MRE.Context, assets: MRE.AssetContainer){
  const screen = MRE.Actor.CreateFromLibrary(context, {
    resourceId: 'artifact:1338743673998803669', // https://account.altvr.com/kits/1329955493782749272/artifacts/1338743673998803669
    actor: {
      name: 'Theater Screen',
      transform: { local: { position: { x: 0, y: SCREEN_HEIGHT, z: 0.1 }, scale: {x: SCREEN_SCALE, y: SCREEN_SCALE, z: 1} } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
    }
   });

  // add some background pattern
  if(DEBUG)
    console.log(`Background: ${backgroundImage}`);

  const backgroundMaterial = assets.createMaterial("bgMat", {
    mainTextureId: assets.createTexture("bgTex", { uri: backgroundImage } ).id,
    mainTextureScale: BACKGROUND_TEXTURE_SCALE
  });
  const background = MRE.Actor.Create(context, {
    actor: {
      transform: { local: { position: { x: 0, y: 0, z: -BACKGROUND_DEPTH } } }, // -Z is towards you when looking at the screen
      appearance: {
          meshId: assets.createBoxMesh("cube", BACKGROUND_WIDTH, BACKGROUND_HEIGHT, BACKGROUND_DEPTH).id, // X is width, Y is height, Z is depth when looking at screen
          materialId: backgroundMaterial.id
      },
      parentId: screen.id
    }
  });

  infoText = MRE.Actor.Create(context, {
    actor: {
      name: 'Info Text',
      transform: { local: { position: { x: 0, y: INFO_TEXT_HEIGHT, z: 0 } } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
      text: {
        contents: WELCOME_TEXT,
        height: APP_TITLE_HEIGHT,
        anchor: MRE.TextAnchorLocation.MiddleCenter,
        justify: MRE.TextJustify.Center,
        font: FONT
      }
    }
  });
}

export function createHelpButton(context: MRE.Context, assets: MRE.AssetContainer){
  let text = `Take a poll!\n\nWhen a poll starts you'll hear a sound and see choices on your left wrist.\n\nYou can vote by clicking or touching the button next to your choice. You may change your vote as often as you'd like.\n\nOnce the first vote is in, results will update on the screen live.`;

  const Button = MRE.Actor.CreateFromLibrary(context, {
    resourceId: 'artifact:1579238405710021245',
    actor: {
      name: 'Help Button',
      transform: { local: { position: HELP_BUTTON_POSITION } },
      collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
    }
   });
  Button.setBehavior(MRE.ButtonBehavior).onClick(user => {
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
}



