const mongoose = require('mongoose');
require('dotenv').config({path:'variables.env'});


// mongoose.connect(process.env.DATABASE,{useNewUrlParser:true});

// mongoose.connection.on('error', (error) => {
//     console.log(error);
// })

const dbConection = async()=>{
    try {

        await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });

        console.log('Base de datos online');
     
    } catch (error) {
        console.log(error);
        throw new Error('Error a la hora de iniciar la DB');
    }

}

require('../models/Vacantes')
require('../models/Usuarios')


module.exports = {
    dbConection,
} 