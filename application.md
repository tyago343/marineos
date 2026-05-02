## MARINE OS

### An application for boats owners

La aplicación esta pensada porque soy dueño de un velero y tengo problemas con los multiples mantenimientos que se le hacen a un barco.
Necesito hacer el seguimiento de motores, velas, cabuyeria, mantenimientos periodicos, eventos generales, inventario, estiba, referencias.
Para esto, la aplicacion contará con pantallas como login, registro, home, mis barcos, mantenimiento, y mas, para gestionar con exito una embarcacion.
La aplicacion contará con la posibilidad de establecer lugares de estiba (cofre de babor en salon, cofre de estribor en proa, cofre de bañera, detras de mamparo de inodoro, etc) y su contenido. Por ejemplo, podré acceder al lugar "cofre de estribor del salon" y ver que su contenido son "una caja de herramientas, servilletas de cocina y cartas nauticas". Esto permitirá conocer donde esta cada cosa en casos que busquemos algo.
La aplicacion contará con la posibilidad de agregar nuestra cabuyería. Por ejemplo, en la pagina cabullería debo poder agregar mi driza de mayor que es de poliester, agregarle cuantos años tiene, cuando fue la ultima vez que se lavó, y ofrecerle al usuario una fecha estimada de cambio, y una fecha de proxima lavada para que los cabos esten en buen estado.
Quiero poder agregar el motor de mi embarcacion de una lista seleccionada (por ejemplo ofrecer los motores que tengamos cargados en el sistema) y que automaticamente me cargue las recomendaciones. Es decir, si elijo un volvo penta 2002 me pregunte cuando fue la ultima vez que cambie el aceite, y automaticamente sepa cuando tengo que cambiar y quede "guardado" en mi barco. Tambien necesito en este caso que seamos capaces de recibir el manual del motor y automaticamente generar ese plan de service que corresponde al motor (revisiones de filtros, aceites, refrigerantes).
En caso de hacer un mantenimiento periodico, la fecha se tiene que restartear. Por ejemplo antifouling anual, si lo hice un 17 de mayo, una vez lo haga tiene que poner la fecha. En caso de retrasos, cuando se haga, se volverá a contar un año desde ese mismo dia.
En la home tiene que haber una seccion de "proximos mantenimientos" que me muestre los proximos trabajos en el barco y un timeline de los ultimos.
Necesitamos una pagina o seccion que nos permita hacer listas de tareas (todo list). Estas listas tienen que poder categorizarse por tipo de trabajo (motor, urgentes, confort, electricidad, etc).
Debemos poder tener un inventario, para tener seguimiento de electronica, elementos de seguridad. Este inventario deberá estar conectado con las estibas cuando corresponda. Por ejemplo, las bengalas de seguridad quiero tenerlas en el inventario, entrar al detalle y ver la factura de compra si existiese, la fecha de caducidad, y donde esta estibado.
Quiero tneer la seccion con datos generales del barco, que tambien se pueden precargar con documentos pdf o similar. Esto sería eslora, manga, metros de velas, motorizacion(linkeado a la pagina propia de nuestro motor donde esta el detalle completo + services hechos + notas, etc).
quiero tener una seccion de checklist de revisiones. Por ejemplo ofrecer templates personalizables para los usuarios/barcos estilo "antes de salir a navegar" y que tenga items como "gasoil abierto, grifo de fondo abierto, baterias cargadas, etc." u otro que sea "al fondear" y tenga cosas como "revisar ancla, tomar referencias en tierra, alarma antigarreo, etc". Estos templates los ofreceremos pero serán totalmente editables para el usuario.
Tenemos que tener apartado de facturas y fotos. Las facturas y las fotos pueden o no estar likeadas a algun item como un elemento de la electronica o pueden estar linkeadas a un service o demas. Tambien tendremos una seccion de notas/referencias que pueden ser linkeables a las fotos
Tendremos en algun apartado de informacion cosas variadas. Marcas que haya cada N metros en la cadena de fondeo, para saber cuanto tiramos. Tendremos cosas como el pin de la torreta de electricidad del pantalan, para tenerlo anotado en algun lado. el mmsi del barco seguramente deba estar en la vhf y en los datos grales del barco, junto con nombre, patente, zona de navegacion (plantillas para precargar productos de seguridad obligatorio).

## Tech stack

Next.js
Supabase
