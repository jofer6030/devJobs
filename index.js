const mongoose = require('mongoose');
const {dbConection} = require('./config/db')

dbConection();

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const createError = require('http-errors');
const passport = require('./config/passport');


require('dotenv').config({path: 'variables.env'});


const app = express();

//bodyparser-->con express solamente
app.use(express.json());
app.use(express.urlencoded({extended:true}))


//habilitar handlebars
app.engine('handlebars',
    exphbs({
        defaultLayout:'layout',
        helpers:require('./helpers/handlebars')
    })
);

app.set('view engine', 'handlebars');

//static files
app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser());

app.use(session({
    secret:process.env.SECRET,
    key:process.env.KEY,
    resave: false,
    saveUninitialized:false,
    store: MongoStore.create({mongoUrl:process.env.DATABASE})
}));

//inicializar passport
app.use(passport.initialize());
app.use(passport.session())

//Alertas y flash messajes
app.use(flash());

//Crear nuestro middleware
app.use((req,res,next) => {
    res.locals.mensajes = req.flash();
    next();
})

app.use('/',router());

//404 pagina no existente                   /* | */
app.use((req,res,next) => {                 /* | */    
    next(createError(404,'No encontrado'))  /* | */
})                                          /* | */
                            /* Siempre usa este codigo para tus errores */
//Administracion de los errores             /* | */
app.use((error,req,res) => {                /* | */
    res.locals.mensaje = error.message;     /* | */
    const status = error.status || 500;     /* | */
    res.locals.status = status;             /* | */
    res.status(status);                     /* | */
    res.render('error')                     /* | */
});                                          /* | */    

//Dejar que Heroku asigne el puerto
const host = '0.0.0.0';
const port = process.env.PORT
app.listen(port,host, () => {
    console.log('El servidor esta funcionando');
} );