import Apierror from "../utils/apierror.js";

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    if (err instanceof Apierror) {
      return res.status(err.statuscode || 500).json({
        success: err.success || false,
        message: err.message || 'Something went wrong',
        errors: err.errors || []
      });
    }
    // If it's not an instance of Apierror, it’s a generic error
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  };
  
  export default errorHandler;
  