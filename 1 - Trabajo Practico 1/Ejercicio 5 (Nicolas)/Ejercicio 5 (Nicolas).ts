interface Electrico {
  cargarBateria(): void;
}

abstract class Vehiculo {
  protected marca: string;
  protected modelo: string;

  constructor(marca: string, modelo: string) {
    this.marca = marca;
    this.modelo = modelo;
  }

  abstract encender(): void;
  abstract apagar(): void;

  mostrarInfo(): void {
    console.log(`Marca: ${this.marca}, Modelo: ${this.modelo}`);
  }
}

class Moto extends Vehiculo {
  private cilindrada: number;

  constructor(marca: string, modelo: string, cilindrada: number) {
    super(marca, modelo);
    this.cilindrada = cilindrada;
  }

  encender(): void {
    console.log(`La moto ${this.marca} ${this.modelo} está encendida.`);
  }

  apagar(): void {
    console.log(`La moto ${this.marca} ${this.modelo} está apagada.`);
  }

  mostrarInfo(): void {
    console.log(
      `Marca: ${this.marca}, Modelo: ${this.modelo}, Cilindrada: ${this.cilindrada}cc.`
    );
  }
}

class Auto extends Vehiculo implements Electrico {
  private cantPuertas: number;

  constructor(marca: string, modelo: string, cantPuertas: number) {
    super(marca, modelo);
    this.cantPuertas = cantPuertas;
  }

  encender(): void {
    console.log(`El auto ${this.marca} ${this.modelo} está encendido.`);
  }

  apagar(): void {
    console.log(`El auto ${this.marca} ${this.modelo} está apagado.`);
  }

  mostrarInfo(): void {
    console.log(
      `Marca: ${this.marca}, Modelo: ${this.modelo}, Cantidad de puertas: ${this.cantPuertas}.`
    );
  }

  cargarBateria(): void {
    console.log(
      `El auto ${this.marca} ${this.modelo} está cargando la batería...`
    );
  }
}

const moto1 = new Moto("Yamaha", "MT-07", 689);
moto1.encender();
moto1.mostrarInfo();
moto1.apagar();

const auto1 = new Auto("Tesla", "Model 3", 4);
auto1.encender();
auto1.mostrarInfo();
auto1.cargarBateria();
auto1.apagar();
