const roo = require('../core/Roo');

module.exports = class MyQueue {
    constructor(queueSize, cashOutPoint) {

      this.cashOutPoint = cashOutPoint;
      this.queueSize = queueSize;

      this.elements = {};
      this.head = 0;
      this.tail = 0;
      this.elementsOverCashoutPoint = 0;
      this.elementsUnderCashoutPoint = 0;
    }
    enqueue(element) {
      this.elements[this.tail] = element;
      this.tail++;
       if(element >= this.cashOutPoint) 
        this.elementsOverCashoutPoint++;
      else 
        this.elementsUnderCashoutPoint++;

      if(this.length > this.queueSize) 
        this.dequeue();
    }
    dequeue() {
      const item = this.elements[this.head];
      delete this.elements[this.head];
      this.head++;
       if(item >= this.cashOutPoint) 
        this.elementsOverCashoutPoint--;
      else 
        this.elementsUnderCashoutPoint--;
      return item;
    }
    peek() {
      return this.elements[this.head];
    }

    showAll(){
      let currentRatio = this.queueSize / this.elementsOverCashoutPoint;
      console.log("avg = " + roo.ratiosForCrashPoint.get("" + this.cashOutPoint) + ", curr = " + currentRatio + ", shold have normally " + (this.queueSize / roo.ratiosForCrashPoint.get("" + this.cashOutPoint))+ " but are " + this.elementsOverCashoutPoint);

      let res = "";
      for (let index = this.head; index < this.tail; index++) {
        res += " " +  this.elements[index] + " ";
      }
      console.log("Q: " + res + "\nLess Than " +  this.cashOutPoint + ": " + this.elementsUnderCashoutPoint + ", over " +  this.cashOutPoint + ": " + this.elementsOverCashoutPoint + ", --hot=" + this.isTableHot());
    }

    isTableHot(){
      return  roo.ratiosForCrashPoint.get("" + this.cashOutPoint) < this.queueSize / this.elementsOverCashoutPoint - 1;
    }

    get length() {
      return this.tail - this.head;
    }
    get isEmpty() {
      return this.length === 0;
    }
  }

  //5 + 15 + 45 + 135 + 440 + 