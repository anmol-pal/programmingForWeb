async function getUrl(url){
    const response = await fetch(url);
    if (!response.ok){
        throw new Error(`HTTP error '${response.status}'`)
    }
    else{
        return await response.json();
    }
}