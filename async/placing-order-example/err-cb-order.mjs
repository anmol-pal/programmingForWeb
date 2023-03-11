export default doOrder;

//.1
function doOrder(orderer, params) {
  orderer.validate(params, (succ, err) => {
    if (err) {
      console.error(err);
    }
    else { //validate ok
      orderer.placeOrder(succ, (succ, err) => {
	if (err) {
	  console.error(err);
	}
	else { //placeOrder ok
	  orderer.sendEmail(succ, (succ, err)  => {
	    if (err) {
	      console.error(err);
	    }
	    else { //email ok
	      console.log(succ);
	    }
	  }); //email
	} //placeOrder ok			    
      }); //placeOrder
    } //validate ok
  }); //validate
}


			
  