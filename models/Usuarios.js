const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt = require('bcrypt');

const usuariosSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        lowercase:true,
        trim:true
    },
    nombre:{
        type:String,
        required: true,
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    token: String,
    expira: Date,
    imagen:String
});

//Método para hashear los password
usuariosSchema.pre('save', async function(next) {
    //Si el password ya sta hasheado
    if(!this.isModified('password')) {
        return next();
    }
    //si no esta hasheado
    const hash = await bcrypt.hash(this.password,12);
    this.password =hash;
    next();
});

//Envia alerta cunado un usuario ya sta registrado
usuariosSchema.post('save', async function(error,doc,next) {
    if(error.name === 'MongoError' && error.code === 11000){
        next('Ese correo ya esta registrado');
    }else{
        next(error);
    }
});

//Autenticar usuarios
usuariosSchema.methods = {
    compararPassword:function(password){
        return bcrypt.compareSync(password,this.password)
    }
}


module.exports = mongoose.model('Usuario',usuariosSchema);