const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuario = mongoose.model('Usuario');

passport.use(new LocalStrategy({
    usernameField:'email',
    passwordField:'password',
},async(email,password,done) => {
    const usuario = await Usuario.findOne({email});

    if(!usuario) return done(null,false,{
        message: 'Usuario no Existente'
    });

    //El usuario exsie vamos a verificarlo
    const verificarPass = usuario.compararPassword(password);
    if(!verificarPass) return done(null,false,{
        message: 'Password Incorrecto'
    });

    //Usuario existe y el passwod es correcto
    return done(null,usuario);
}));


passport.serializeUser((usuario,done) => done(null,usuario._id))
passport.deserializeUser(async(id,done) => {
    const usuario = await Usuario.findById(id).exec();
    return done(null,usuario) 
});

module.exports = passport;