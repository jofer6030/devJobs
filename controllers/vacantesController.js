// const Vacante = require('../models/Vacante');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');//segunda forma de importar el modelo
const {check,validationResult} = require('express-validator');

const multer = require('multer');
const shortid = require('shortid');


exports.formularioNuevaVacante = (req,res) => {
    res.render('nueva-vacante',{
        nombrePagina: 'Nueva Vacante',
        tagline:'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre:req.user.nombre,
        imagen: req.user.imagen,
    })
}

//agregar vacante a la BD
exports.agregarVacante = async(req,res) => {
    const vacante = new Vacante(req.body);

    //usuario autor de la vacante
    vacante.autor = req.user._id;

    //crear arreglo de skills
    vacante.skills = req.body.skills.split(',');
    
    //almacenarlo en la BD

    const nuevaVacante = await vacante.save();

    //redireccionar 
    res.redirect(`/vacantes/${nuevaVacante.url}`);
}

//muestra una vacantante
exports.mostrarVacante = async(req,res,next) =>{
    const {url} = req.params; 
    const vacante = await Vacante.findOne({url}).populate('autor').lean();
    if(!vacante) return next();

    res.render('vacante',{
        vacante,
        nombrePagina:vacante.titulo,
        barra:true
    })
}

exports.formEditarVacante = async(req,res,next) =>{
    const {url} = req.params; 
    const vacante = await Vacante.findOne({url}).lean();

    if(!vacante) return next();

    res.render('editar-vacante',{
        vacante,
        nombrePagina:`Editar-${vacante.titulo}`,
        cerrarSesion: true,
        nombre:req.user.nombre,
        imagen: req.user.imagen,
    })
}

exports.editarVacante = async(req,res,next) =>{
    const vacanteActualizada = req.body
    const {url} = req.params

    vacanteActualizada.skills= req.body.skills.split(',');
    const vacante = await Vacante.findOneAndUpdate({url},vacanteActualizada,{
        new:true,
        runValidators:true
    });//el segundo valor loque se esta actualizando

    res.redirect(`/vacantes/${vacante.url}`);
}

//Validar y sanitizar los campos de las nuevas vacantes
exports.validarVacante = async(req,res,next) =>{
    //sanitizar los campos
    const rules =[
        check('titulo','Agrega un titulo a la vacante').not().isEmpty().escape(),
        check('empresa','Agrega una Empresa').not().isEmpty().escape(),
        check('ubicacion','Agrega una ubicacion').not().isEmpty().escape(),
        check('salario').escape(),
        check('contrato','Selecciona un tipo de contrato').not().isEmpty(),
        check('skills','Agrega al menos una habilidad').not().isEmpty(),
    ];
    await Promise.all(rules.map(validation => validation.run(req)));

    const errores =validationResult(req)
    if(!errores.isEmpty()) { 
        const {errors} = errores
        req.flash('error',errors.map(error => error.msg));
        res.render('nueva-vacante',{
            nombrePagina: 'Nueva Vacante',
            tagline:'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre:req.user.nombre,
            mensajes: req.flash()
        });
        return;
    }
    
    next();
}

exports.eliminarVacante = async(req, res)=>{
    const {id} = req.params;

    const vacante = await Vacante.findById(id)

    if(verificarAutor(vacante,req.user)){
        //Todo bien , si es el usuario eliminar
        vacante.remove();
        res.status(200).send('Vacante Eliminada Correctamente');
    }else{
        //no permitido
        res.status(403).send('Error');
    }
}

const verificarAutor = (vacante = {},usuario = {}) =>{
    if(!vacante.autor.equals(usuario._id)){
        return false;
    }
    return true;
}

//subir archivos en PDF
exports.subirCV = (req, res,next) => {
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
            res.redirect('back');
            return;
        }else{
            return next();
        }
    });
}
const configuracionMulter = {
    limits: {fileSize: 100000},
    storage: fileStorage = multer.diskStorage({
        destination:(req, file, cb) => {
            cb(null,__dirname+'../../public/uploads/cv')
        },
        filename:(req, file, cb) =>{
            const extension = file.mimetype.split('/')[1];
            cb(null,`${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype === 'application/pdf'){
            //el callback se ejecuta como true o false --- true cuando la imagen se acepta
            cb(null,true)
        }else{
            cb(new Error('Formato no válido'),false)
        }
    }
}

const upload = multer(configuracionMulter).single('cv');

//Almacenar los candidatos en la BD
exports.contactar = async(req, res, next)=>{
    const {url} = req.params;
    const vacante = await Vacante.findOne({url});

    if(!vacante) return next();

    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    //almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save()

    req.flash('correcto','Se envió tu Curriculum Correctamente');
    res.redirect('/');
}

exports.mostrarCandidatos = async(req,res,next) =>{
    const {id} = req.params;

    const vacante = await Vacante.findById(id).lean();

    if(vacante.autor != req.user._id.toString()){
        return next();
    }

    if(!vacante) return next();
    
    res.render('candidatos',{
        nombrePagina:`Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre:req.user.nombre,
        imagen: req.user.imagen,
        candidatos:vacante.candidatos
    })
}

//Buscador de vacantes
exports.buscarVacante = async(req,res) => {
    const vacantes = await Vacante.find({
        $text :{
            $search: req.body.q
        }
    }).lean();

    //mostrar las vacantes
    res.render('home',{
        nombrePagina:`Resultados para la búsqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })
}