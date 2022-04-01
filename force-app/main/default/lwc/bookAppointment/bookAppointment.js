import { LightningElement,track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
export default class BookAppointment extends LightningElement {
    selectedPatientId;  //set by search patient child component
    appointment;    //set by fill appointment details child component
    activeSections = ['SearchPatient'];
    activeSectionsMessage = '';
    patients;

    handleBackClick() {
        this.activeSections = ['SearchPatient'];
    }

    @track currentStep = '1';
 
    handleOnStepClick(event) {
        
        this.currentStep = event.target.value;
        this.selectedPatientId = event.detail;
        this.activeSections = ['FillAppointmentDetails'];
    }
 
    get isStepOne() {
        return this.currentStep === "1";
    }
 
    get isStepTwo() {
        return this.currentStep === "2";
    }
 
    get isStepThree() {
        return this.currentStep === "3";
    }
 
    get isEnableNext() {
        return this.currentStep != "3";
    }
 
    get isEnablePrev() {
        return this.currentStep != "1";
    }
 
    get isEnableFinish() {
        return this.currentStep === "3";
    }
 
    handleNext(){
       
        if (!this.selectedPatientId) {
            
            this.showToast("Input missing", "Please select a patient before clicking Next", "error");
            return;
        } else {
            this.activeSections = ['FillAppointmentDetails'];
        }

        if(this.currentStep == "1"){
            this.currentStep = "2";
        }
        else if(this.currentStep = "2"){
            this.currentStep = "3";
        }
    }
 
    handlePrev(){
        if(this.currentStep == "3"){
            this.currentStep = "2";
        }
        else if(this.currentStep = "2"){
            this.currentStep = "1";
            this.activeSections = ['SearchPatient'];
        }
    }

    handleNextClick(event) {
        console.log(JSON.stringify(event.detail));
        this.selectedPatientId = event.detail.selectedPatientId;
        this.patients = event.detail.patients;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
 
    handleFinish(){
 
    }
    
}