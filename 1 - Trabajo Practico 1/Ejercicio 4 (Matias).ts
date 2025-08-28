interface Volador {
    volar(): void;
}

abstract class AnimalUML {
    protected nombre: string;
    constructor(nombre: string) {
        this.nombre = nombre;
    }
    abstract hacerSonido(): void;
}

class Pajaro extends AnimalUML implements Volador {
    private especie: string;
    constructor(nombre: string, especie: string) {
        super(nombre);
        this.especie = especie;
    }
    hacerSonido(): void {
        console.log("Pío pío");
    }
    volar(): void {
        console.log(`${this.nombre} está volando`);
    }
}

class Zorro extends AnimalUML {
    private especie: string;
    constructor(nombre: string, especie: string) {
        super(nombre);
        this.especie = especie;
    }
    hacerSonido(): void {
        console.log("¡Ring-ding-ding-ding-dingeringeding!");
    }
}

const pajaro = new Pajaro("Piolín", "Canario");
pajaro.hacerSonido();
pajaro.volar();

const zorro = new Zorro("Zorrito", "Rojo");
zorro.hacerSonido();
