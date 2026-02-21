


export const authrization = (roles=[]) => { 
    return (req, res, next) => {
        if (roles.includes(req.user.role)) {
            next()
        } else {
            throw new Error("unauthorized", { cause: 401 });
        }
    }
}
    