import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const DEBUG = false;

export function preload(assets: MRE.AssetContainer){
  assets.createSound('startSound', { uri: 'start.ogg' } );
  assets.createSound('clickSound', { uri: 'click.ogg' } );
}

export function pollStarted(assets: MRE.AssetContainer, actor: MRE.Actor){
  if(actor){
    actor.startSound(findSoundId(assets, 'startSound'), {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 2.5
    });
  }
}

export function pollTaken(assets: MRE.AssetContainer, actor: MRE.Actor){
  if(actor){
    actor.startSound(findSoundId(assets, 'clickSound'), {
      volume: 0.1,
      looping: false,
      doppler: 0.0,
      spread: 0.7,
      rolloffStartDistance: 1000 // everyone needs to hear it, albeit at a low volume
    });
  }
}

// look up the sound by name (e.g. startSound)
function findSoundId(assets: MRE.AssetContainer, name: string) : MRE.Guid{
  return assets.sounds.filter(x => x.name == name)[0].id;
}
