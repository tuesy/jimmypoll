export function pollNameFrom(inputs: string[]){
  let name = inputs.slice(0,1)[0].trim();

  name = name.trim().charAt(0).toUpperCase() + name.slice(1); // capitalize first letter
  if(name.charAt(name.length-1) != '?') // stick a question at the end
    name += '?';

  return name;
}

export function choiceNamesFrom(inputs: string[], max: number){
  let names = inputs.slice(1,max+1);

  for (let i = 0; i < names.length; i++){
    // remove whitespace and capitalize first letter
    names[i] = names[i].trim().charAt(0).toUpperCase() + names[i].slice(1);
  }

  return names;
}


