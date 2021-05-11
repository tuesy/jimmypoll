import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const fetch = require('node-fetch');
const url = require('url')
const WELCOME_TEXT = 'Poll App';
const INFO_TEXT_HEIGHT = 1.2;
const BUTTON_HEIGHT = 0.6;
const DEBUG = true;

export default class Poll {
	private assets: MRE.AssetContainer;
  private libraryActors: MRE.Actor[] = [];
  private infoText : any;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
	}

	private async started() {
		this.assets = new MRE.AssetContainer(this.context);

    this.createInterface();

    if(DEBUG){
      this.poll('doge');
      this.poll('Doge?');
    }
	}

  private createInterface(){
    this.infoText = MRE.Actor.Create(this.context, {
      actor: {
        name: 'Info Text',
        transform: { local: { position: { x: 0, y: INFO_TEXT_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        text: {
          contents: WELCOME_TEXT,
          height: 0.1,
          anchor: MRE.TextAnchorLocation.MiddleCenter,
          justify: MRE.TextJustify.Center
        }
      }
    });

    const helpButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579238405710021245',
      actor: {
        name: 'Help Button',
        transform: { local: { position: { x: 0.35, y: BUTTON_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
     });
    helpButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(`
This app helps you polls users in your Event or World
  `).then(res => {
          if(res.submitted){
            // clicked 'OK'
          }
          else
            this.infoText.text.contents = WELCOME_TEXT;
      })
      .catch(err => {
        console.error(err);
      });
    });

    const pollButton = MRE.Actor.CreateFromLibrary(this.context, {
      resourceId: 'artifact:1579239603192201565', // https://account.altvr.com/kits/1579230775574790691/artifacts/1579239603192201565
      actor: {
        name: 'Poll Button',
        transform: { local: { position: { x: 0, y: BUTTON_HEIGHT, z: 0 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } }
      }
    });
    pollButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt(`
Enter a poll question and click "OK". We'll format it to save you the trouble
(e.g. 'doge' => 'Doge?').`, true)
      .then(res => {
          if(res.submitted && res.text.length > 0){
            this.poll(res.text);
          }
          else{
            // user clicked 'Cancel'
          }

      })
      .catch(err => {
        console.error(err);
      });
    });
  }

  private poll(q: string){
    q = q.trim();
    q = q.charAt(0).toUpperCase() + q.slice(1); // capitalize first letter
    if(q.charAt(q.length-1) != '?') // stick a question at the end
      q += '?';
    this.infoText.text.contents = q;
    if(DEBUG)
      console.log(`Polled: ${q}`);
  }
}




