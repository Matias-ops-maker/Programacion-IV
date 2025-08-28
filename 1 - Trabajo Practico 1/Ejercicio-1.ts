interface Animal {
  hacerSonido(): void;
  moverse(): void;
}

class Perro implements Animal {
  hacerSonido(): void {
    console.log("Guau! Guau!");
  }
  moverse(): void {
    console.log("El perro corre");
  }
}
console.log("Clase Perro: ");
const perro = new Perro();
perro.hacerSonido();
perro.moverse();