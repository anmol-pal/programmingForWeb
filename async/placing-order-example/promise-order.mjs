export default doOrder
function doOrder(orderer, params){
    orderer.validate(params)
    .then(succ => orderer.placeOrder(succ))
    .then(succ => orderer.sendEmail(succ))
    .then(succ => console.log(succ))
    .catch(err=> console.error(err));
}