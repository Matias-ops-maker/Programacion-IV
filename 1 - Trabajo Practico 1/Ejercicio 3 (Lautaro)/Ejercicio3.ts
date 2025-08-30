abstract class Empleado {
    constructor(protected nombre: string, protected salarioBase: number) {}

    abstract calcularSalario(): number;
}

class EmpleadoTiempoCompleto extends Empleado {
    calcularSalario(): number {
        return this.salarioBase + 20000;
    }
}

class EmpleadoMedioTiempo extends Empleado {
    calcularSalario(): number {
        return this.salarioBase / 2;
    }
}

const empleados: Empleado[] = [
    new EmpleadoTiempoCompleto("Juan", 50000),
    new EmpleadoMedioTiempo("Ana", 40000),
    new EmpleadoTiempoCompleto("Luis", 60000),
    new EmpleadoMedioTiempo("Maria", 30000)
]

empleados.forEach(empleado => {
    console.log(`Empleado: ${empleado['nombre']}, salario: ${empleado.calcularSalario()}`)
})