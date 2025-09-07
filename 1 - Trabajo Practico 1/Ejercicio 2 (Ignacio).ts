abstract class FiguraGeometrica {
  protected nombre: string;

  constructor(nombre: string) {
    this.nombre = nombre;
  }

  abstract calcularArea(): number;
}

class Cuadrado extends FiguraGeometrica {
  private lado: number;

  constructor(lado: number) {
    super("Cuadrado");
    this.lado = lado;
  }

  calcularArea(): number {
    return this.lado * this.lado;
  }
}

class Triangulo extends FiguraGeometrica {
  private base: number;
  private altura: number;

  constructor(base: number, altura: number) {
    super("Triángulo");
    this.base = base;
    this.altura = altura;
  }

  calcularArea(): number {
    return (this.base * this.altura) / 2;
  }
}

class Circulo extends FiguraGeometrica {
  private radio: number;

  constructor(radio: number) {
    super("Círculo");
    this.radio = radio;
  }

  calcularArea(): number {
    return Math.PI * Math.pow(this.radio, 2);
  }
}

const figuras: FiguraGeometrica[] = [
  new Cuadrado(4),
  new Triangulo(10, 5),
  new Circulo(3)
];

figuras.forEach(fig => {
  console.log(`${fig.constructor.name}: área = ${fig.calcularArea()}`);
});
