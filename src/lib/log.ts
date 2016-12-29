
export const logInfo = (service:{name:string, port:number}) =>  (message: string ) => {
    console.info(`${service.name}(port:${service.port}) ${message}`);
}