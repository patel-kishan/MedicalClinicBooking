import { LightningElement, api, wire } from 'lwc';
import searchRecords from '@salesforce/apex/CustomLookupFieldLWCController.searchRecords';

export default class CustomLookupField extends LightningElement { 
    @api selectedValue;  
    @api selectedRecordId;  
    @api objectApiName;  
    @api iconName;  
    @api lookupLabel;
    @api required;
    @api searchPlaceholder = 'Search records';
    @api filter;
    recordsList;
    message;
      
    onLeave(event) {  
        setTimeout(() => {
            let input = this.template.querySelector('.mainInput');

            if (input) {
                input.value = '';
            }

            this.recordsList = null;  
        }, 300);  
    }  
      
    onRecordSelection(event) {  
        this.selectedRecordId = event.target.dataset.key;  
        this.selectedValue = event.target.dataset.name; 
        this.onSeletedRecordUpdate();  
    }  
     
    handleKeyChange(event) {  
        const searchTerm = event.target.value;
        this.getLookupResult(searchTerm);  
    }  
     
    removeRecordOnLookup(event) {
        event.stopPropagation();
        this.selectedValue = null;  
        this.selectedRecordId = null;  
        this.recordsList = null;  
        this.onSeletedRecordUpdate();
    }

    getLookupResult(searchTerm) {  
        searchRecords({ searchTerm: searchTerm, objectApiName : this.objectApiName, filter : this.filter })  
            .then((result) => {  
                if (result.length === 0) {  
                    this.recordsList = [];  
                    this.message = 'No Records Found';  
                } else {  
                    this.recordsList = result;  
                    this.message = '';  
                }  
                this.error = undefined;  
            }).catch((error) => {  
                this.error = error;  
                this.recordsList = undefined;  
            });  
    }  
    
    onSeletedRecordUpdate(){  
        const event = new CustomEvent('recordselection', {  
            detail: { selectedRecordId: this.selectedRecordId, selectedValue: this.selectedValue }  
        });
        this.dispatchEvent(event);  
    }  
}