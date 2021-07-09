const mongoose = require('mongoose');
const Usuario = mongoose.model('Usuario');
const {check,validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');



exports.subirImagen = (req, res,next) => {
    upload(req,res,error =>{
        if(error){
            if(error instanceof multer.MulterError){              
                if(error.code==='LIMIT_FILE_SIZE'){
                    req.flash('error','El archivo es muy grande máximo 100kb')
                }else{
                    req.flash('error',error.message);
                }
            }else{
                req.flash('error',error.message);
            }
            res.redirect('/administracion');
            return;
        }else{
            return next();
        }
    });
}
//Opciones de multer
const configuracionMulter = {
    limits: {fileSize: 100000},
    storage: fileStorage = multer.diskStorage({
        destination:(req, file, cb) => {
            cb(null,__dirname+'../../public/uploads/perfiles')
        },
        filename:(req, file, cb) =>{
            const extension = file.mimetype.split('/')[1];
            cb(null,`${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            //el callback se ejecuta como true o false --- true cuando la imagen se acepta
            cb(null,true)
        }else{
            cb(new Error('Formato no válido'),false)
        }
    }
}
const upload = multer(configuracionMulter).single('imagen');


exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta',{
        nombrePagina: 'Crea tu cuenta en devJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}


exports.validarRegistro = async(req, res,next) => {
    const rules =[
        check('nombre','El nombre es Obligatorio').not().isEmpty().escape(),
        check('email','El email debe ser valido').isEmail().escape(),
        check('password','El password no puede ir Vacio').not().isEmpty().escape(),
        check('confirmar','Confirmar password no puede ir Vacio').not().isEmpty().escape(),
        check('confirmar','El password es diferente').equals(req.body.password),
    ];

    await Promise.all(rules.map(validation => validation.run(req)));

    // console.log(req.body)
    const errores =validationResult(req)
    if(!errores.isEmpty()) { 
        const {errors} = errores
        req.flash('error',errors.map(error => error.msg));
        res.render('crear-cuenta',{
            nombrePagina: 'Crea tu cuenta en devJobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash(),
        });
        return;
    }
    
    next();

}

exports.crearUsuario = async(req, res, next) => {
    //crear usuario
    const usuario = new Usuario(req.body);


    try {
        await usuario.save();
        res.redirect('/iniciar-sesion');
    } catch (error) {
        req.flash('error',error);
        res.redirect('crear-cuenta');
    }

}

//formulario para iniciar sesion
exports.formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina:'Iniciar Sesión devJobs'
    })
}

//Form editar el perfil
exports.formEditarPerfil = (req, res)=>{
    // console.log(req.user.toObject())
    res.render('editar-perfil',{
        nombrePagina: 'Edita tu Perfil en devJobs',
        usuario: req.user.toObject(),
        cerrarSesion: true,
        nombre:req.user.nombre,
        imagen: req.user.imagen,
    })
}

//Guardar Cambios editar perfil
exports.editarPerfil = async(req, res) => {
    const {_id} = req.user;
    const usuario = await Usuario.findById(_id);
    
    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;

    if(req.body.password){
        usuario.password = req.body.password;
    }

    if(req.file) {
        usuario.imagen = req.file.filename
    }
    await usuario.save();

    req.flash('correcto','Cambios Guardados Correctamente')

    //redirect 
    res.redirect('/administracion');
}

//sanitizar y validar dormulario de editar perfiles
exports.validarPerfil = async(req, res, next) => {
   const rules=[
       check('nombre','El nombre no puede ir vacio').not().isEmpty().escape(),
       check('email','El correo no puede ir vacio').not().isEmpty().escape(),
       check('password').escape(),
   ]
   await Promise.all(rules.map(validation => validation.run(req)));

   const errores = validationResult(req);
   if(!errores.isEmpty()) { 
        const {errors} = errores
        req.flash('error',errors.map(error => error.msg));
        res.render('editar-perfil',{
            nombrePagina: 'Edita tu perfil',
            usuario: req.user.toObject(),
            cerrarSesion: true,
            nombre:req.user.nombre,
            imagen: req.user.imagen,
            mensajes: req.flash(),
        });
        return;
    }
    next();
}