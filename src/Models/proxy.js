/*
    Heriverse Proxy

    author: 3DResearch s.r.l.

===========================================================*/

/**
Class representing a Proxy
@class Proxy
@example 
new Proxy()
*/
export default class Proxy {

    constructor(shape, node){
        this.shape = shape;
        this.node = node;
        this.epochs = [];
    }

    addEpoch(epoch) {
        this.epochs.push(epoch);
    }

    isVisibleInEpoch(epoch){
        for(let i = 0 ; i< this.epochs.length ; i++){
            if(this.epochs[i] == epoch) return true;
        }
        return false;
    }

}