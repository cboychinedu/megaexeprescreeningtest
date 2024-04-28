// Creating a middle ware function to check if the user is logged in 
const protectedRoute = (req, res, next) => {
    // Getting the value for the user's authenticaton, and if it's valid 
    try {
        // Checking the is auth value 
        let isAuth = req.session.isAuth; 

        // Checking if the user is a valid user 
        if (isAuth) {
            // Move on to the next middleware 
            next(); 
        }

        // If the user is not authenticated 
        else {
            // Redirect the user back to the login page 
            return res.redirect('/'); 
        }
    }

    // Catch the error 
    catch (error) {
        // Redirect the user back to the login page 
        return res.redirect('/'); 
    }
}

// Exporting the route
module.exports = protectedRoute; 