export default doOrder;


function doOrder(orderer, params){
    orderer.validate(params, succ => {
        orderer.placeOrder(succ, succ=> {
            orderer.sendEmail(succ, succ=>{
                console.log(succ);
            });
        });
    });
}