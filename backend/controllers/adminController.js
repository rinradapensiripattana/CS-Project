


// API for adding doctor

const addDoctor = async (req, res) => {

    try {
        const { id,name, email, password, speciality, degree, experience, about} = req.body
        const imageFile = req.file
        console.log({id,name, email, password, speciality, degree, experience, about}, imageFile) ;

    } catch (error) {

        console.log(error);

    }


}

export {addDoctor}