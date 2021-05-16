export const BACKGROUND_IMAGES = ["tile01.png", "tile02.png", "tile03.png", "tile04.png", "tile05.png", "tile06.png", "tile07.png", "tile08.png", "tile09.png"];

// hosts can choose a background
export function chooseBackgroundImage(params: any){
  let index = Number(params.bg);
  let total = BACKGROUND_IMAGES.length;
  if(index > 0 && index < total)
    return BACKGROUND_IMAGES[index-1];
  else // randomly choose one by default
    return BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
}