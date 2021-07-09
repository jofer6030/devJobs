import axios from 'axios';
import Swal from 'sweetalert2';


document.addEventListener('DOMContentLoaded',() => {
    const skills = document.querySelector('.lista-conocimientos');

    //limpiar las alertas
    let alertas = document.querySelector('.alertas');
    if(alertas) {
        limpiarAlertas();
    }


    if(skills) {
        skills.addEventListener('click', agregarSkills);

        //una vez que estamos en editar llamar la funcion
        skillsSeleccionados();

    }

    const vacantesListado = document.querySelector('.panel-administracion');
    if(vacantesListado){
        vacantesListado.addEventListener('click', accionesListado);
    }
})

const skills = new Set();
const agregarSkills = e => {
    if(e.target.tagName==='LI'){ //li debe estar en mayuscula LI
        if(e.target.classList.contains('activo')){
            //quitar la clase
            skills.delete(e.target.textContent)
            e.target.classList.remove('activo')
        }else{
            //agregarlo al set
            skills.add(e.target.textContent)
            e.target.classList.add('activo')
        }
    }
    const skillsArray = [...skills]
    // console.log(skillsArray)
    document.querySelector('#skills').value = skillsArray;
}

const skillsSeleccionados = () =>{
    //usar el Array.from() para covervir un NodeList a un array 
    const seleccionadas =Array.from(document.querySelectorAll('.lista-conocimientos .activo'));

    seleccionadas.forEach(seleccionada => {
        skills.add(seleccionada.textContent)
    })
    //inyectarlo en el hidden
    const skillsArray = [...skills]
    document.querySelector('#skills').value = skillsArray;
}

const limpiarAlertas = () =>{
    const alertas = document.querySelector('.alertas')
    const interval = setInterval(() => {
        if(alertas.children.length > 0){
            alertas.removeChild(alertas.children[0]);
        }else if (alertas.children.length === 0){
            alertas.parentElement.removeChild(alertas);
            clearInterval(interval)
        }
    }, 2000);
}

//Eliminar vacantes
const accionesListado = e => {
    e.preventDefault();

    if(e.target.dataset.eliminar){
        //eliminar por axios
        const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;
        
        Swal.fire({
            title: '¿Confirmar Eliminacion?',
            text: "Una vez eliminada no se puede recuperar",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Eliminar',
            cancelButtonText:'No, Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                //enviar la peticion con axios

                //Axios para eliminar el registro
                axios.delete(url,{params: {url}})
                    .then(respuesta => {
                        if(respuesta.status === 200){                       
                            Swal.fire(
                                'Eliminado!',
                                respuesta.data,
                                'success'
                            );

                            //TODO: para eliminar del DOM
                            e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement);
                        }
                    })
                    .catch(err => {
                        Swal.fire({
                            type: 'error',
                            title: 'Hubo un error',
                            text:'No se pudo eliminar'
                        })
                    })
            }
        })
    }else if (e.target.tagName === 'A'){ //Si el click se persneta en un enlace el tag es "a" pero se nmombre en mayus "A"
        window.location.href = e.target.href;
    }
}