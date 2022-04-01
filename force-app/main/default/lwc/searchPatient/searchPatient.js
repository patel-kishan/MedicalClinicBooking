import { LightningElement, api } from 'lwc';
import searchPatients from '@salesforce/apex/SearchPatientController.searchPatients';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class SearchPatient extends LightningElement {    
    isSpinnerLoading = false;
    error;
    @api patients; 

    get hasPatients() {
        return this.patients && this.patients.length;
    }

    get columns() {
        return [
            { label: "Patient Name", fieldName: "Name" },
            { label: "Gender", fieldName: "Gender__c" },
            { label: "Phone", fieldName: "Phone", type: "phone" },
            { label: "Email", fieldName: "Email", type: "email" }
        ]; 
    }

    handleCustomLookupSelection(event){
        this.isisSpinnerLoading = true;
       // console.log('the selected record id is ' + event.detail.selectedRecordId);
        this.patients = undefined;

        searchPatients({ contactId: event.detail.selectedRecordId})        
        .then(result => {
            if (result) {
               
                this.patients = result;
                let selectedPatientId = event.detail.selectedRecordId;
                let detail = {};
                detail.selectedPatientId = selectedPatientId;
                detail.patients = result;

                this.dispatchEvent(new CustomEvent('clicknext', {
                    detail: detail
                }));

                this.isSpinnerLoading = false;
            } else {
                
            }
        })
        .catch(error => {
            this.error = error;
            this.showToast("ERROR", "Error in searching patient, please contact admin", "error");
            this.isSpinnerLoading = false;
        }); 
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
}