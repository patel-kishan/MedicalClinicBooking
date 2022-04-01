import { LightningElement, wire, api,track } from 'lwc';
import getSpecializationList from '@salesforce/apex/FillAppointmentDetailsController.getSpecializations';
import getPhysiciansList from '@salesforce/apex/FillAppointmentDetailsController.getPhysiciansForSpecialization';
import getAvailableSlots from '@salesforce/apex/FillAppointmentDetailsController.getAvailableSlots';
import sendCalendarRequestAccess from '@salesforce/apex/FillAppointmentDetailsController.sendCalendarRequestAccess';
import getCalendarEvents from "@salesforce/apex/GoogleWebService.getCalendarEvents";
import createEvent from "@salesforce/apex/GoogleWebService.createEvent";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class FillAppointmentDetails extends LightningElement {   
    @track openModal = false;
    
    isSpinnerLoading = false;
    error;

    selectedSpecializationId = '';
    specializationList;

    selectedSpecializationPrice = '';
    specializationList;

    selectedPhysicianId = '';
    physicianList;
    selectedPhysician;
   
    hasCalendarAccess;
    showAppointmentSlots;
    availableSlots;

    selectedAppointment;
    selectedDate = this.currentDate;

    @api selectedPatientId;
    
    @wire(getSpecializationList) specializationList;
    
    get specializationOptions() {
        var result = [];
        if(this.specializationList!==null && this.specializationList.data!==null && this.specializationList.data!==undefined && this.specializationList.data.length > 0) {
            for(let counter in this.specializationList.data) {
                let specialization = this.specializationList.data[counter];
                result.push({ label: specialization.Name, value: specialization.Id });
            }
        }
        else {
            result.push({ label: '--No specialization found--', value: ''});
        }
        return result;
    }    

    get priceOptions() {
        var result = [];
        if(this.specializationList!==null && this.specializationList.data!==null && this.specializationList.data!==undefined && this.specializationList.data.length > 0) {
            for(let counter in this.specializationList.data) {
                let specialization = this.specializationList.data[counter];
                result.push({ label: specialization.Appointment_Price__c, value: specialization.Id });
            }
        }
        else {
            result.push({ label: '--No Price found--', value: ''});
        }
        return result;
    } 

    handleSpecializationChange(event) {
        this.physicianList = undefined;
        this.selectedPhysicianId = undefined;        
        this.hasCalendarAccess = undefined;
        this.selectedSpecializationPrice = undefined;
        this.resetAppointmentSelection();
        this.isSpinnerLoading = true;
        this.selectedSpecializationId = event.detail.value;  
       // console.log('KP spec1' +this.specializationList.data);      
        for(let counter in this.specializationList.data) {
                let specialization = this.specializationList.data[counter];
              //  console.log('KP spec2' +specialization.Id);
              //  console.log('KP spec3' +this.selectedSpecializationId);
                if( this.selectedSpecializationId == specialization.Id){
                    this.selectedSpecializationPrice = specialization.Appointment_Price__c;
                }
            }
        
        //Call method to refresh Physician list options
        getPhysiciansList({ specId: this.selectedSpecializationId })
            .then(result => {
                this.physicianList = result;
                this.isSpinnerLoading = false;
            })
            .catch(error => {
                this.error = error;
                this.physicianList = undefined;
                this.isSpinnerLoading = false;
            });        
    }

    handleSpecializationPriceChange(event) {
        this.physicianList = undefined;
        this.selectedPhysicianId = undefined;        
        this.hasCalendarAccess = undefined;
        this.resetAppointmentSelection();
        this.isSpinnerLoading = true;
        
        
        this.selectedSpecializationPrice = event.detail.value;        
        //Call method to refresh Physician list options
        getPhysiciansList({ specId: this.selectedSpecializationPrice })
            .then(result => {
                this.physicianList = result;
                this.isSpinnerLoading = false;
            })
            .catch(error => {
                this.error = error;
                this.physicianList = undefined;
                this.isSpinnerLoading = false;
            });        
    }

    get physicianOptions() {
        var result = [];
        if(this.physicianList!==null && this.physicianList!==undefined && this.physicianList.length > 0) {
            for(let counter in this.physicianList) {
                let physician = this.physicianList[counter];
                result.push({ label: physician.Name, value: physician.Id });
            }
        }
        else {
            result.push({ label: '--No physician found--', value: ''});
        }
        return result;        
    }

    handlePhysicianChange(event) {
        this.hasCalendarAccess = undefined;
        this.resetAppointmentSelection();
        this.selectedPhysicianId = event.detail.value;
        this.selectedPhysician = this.initialiseSelectedPhysician(this.selectedPhysicianId);        
    }

    initialiseSelectedPhysician(selectedPhysicianId) {
        if(!selectedPhysicianId && !this.physicianList) {
            return;            
        }
        const index = this.physicianList.findIndex(phy => phy.Id ===selectedPhysicianId);
        return this.physicianList[index];        
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('clickback'));
    }

    handleCheckAvailability() {
       // console.log('KP handleCheckAvailability Begins');
        this.resetAppointmentSelection();

        if(!this.selectedPatientId) {
            this.showToast("Input missing", "Please select a patient", "error");
            return;
        }

        if(!this.selectedSpecializationId) {
            this.showToast("Input missing", "Please select a specialization", "error");
            return;
        }
        if(!this.selectedPhysicianId) {
            this.showToast("Input missing", "Please select a physician", "error");
            return;
        }
        if(!this.selectedDate) {
            this.showToast("Input missing", "Please select a date", "error");
            return;
        }
        if(!this.validateDate(this.selectedDate)) {
            return;
        }
        
        if(!this.selectedPhysician.Email) {
            this.showToast("Data Issue", "Please populate email in physician record and then recheck availability", "error");
            return;
        }
        this.openModal = true;
        this.isSpinnerLoading = true;
       // console.log('KP this.selectedPhysician.Email='+this.selectedPhysician.Email);
       // console.log('KP this.selectedDate='+this.selectedDate);
        //Google calendar API call tp get booked slots for the day      
        getCalendarEvents({ calendarId: this.selectedPhysician.Email, inpDate: this.selectedDate })
        .then((resp) => {
          //  console.log('KP getCalendarEvents THEN Begins');
            this.showAppointmentSlots = true;
            console.log('KP resp='+resp);
            console.log('KP resp JSON='+JSON.stringify(resp));
            if (resp === "no_access") {
                this.hasCalendarAccess = false;
                this.isSpinnerLoading = false;
            }
            else {
                this.hasCalendarAccess = true;
                //Call Apex method to get available slots for the day                
                this.fetchAvailableSlots(resp, this.selectedDate);
                
            }
        })
        .catch((error) => {
           // console.log('KP getCalendarEvents CATCH Begins');
            this.isSpinnerLoading = false;
            this.showToast("ERROR", "Error in getting current calendar events, please contact admin", "error");
            //console.log('error JSON='+JSON.stringify(error));
            //console.log('error='+error);
        });
    }

    fetchAvailableSlots(apiResp, inputDate) {                
        getAvailableSlots({ apiResponse: apiResp, inpDate: inputDate })
        .then((result) => {            
            this.availableSlots = result;
            this.isSpinnerLoading = false;
        })
        .catch((error) => {
            this.isSpinnerLoading = false;
            this.showToast("ERROR", "Error in fetching available slots, please contact admin", "error");
            //console.log('error JSON='+JSON.stringify(error));
            //console.log('error='+error);
        });
    }

    get hasAvailableSlots() {
        return this.availableSlots && this.availableSlots.length;        
    }

    handleDateChange(event) {
        this.selectedDate = event.detail.value;
        this.resetAppointmentSelection();
    }

    validateDate(selectedDate) {
        let isValid = true;
        const todayDate = new Date();
        const dateobj = new Date(selectedDate);
        var result = new Date().setDate(new Date().getDate() + 5);
        const maxDate = new Date(result);

        var isDateinRange = (dateobj>=todayDate && dateobj<=maxDate);
        if(!(dateobj>=todayDate && dateobj<=maxDate)) {
            this.showToast("Input missing", "Appointment date can be between today and next 5 days", "error");
            isValid = false;
        }
        return isValid;
    }

    handleRequestAccess() {
        if(!this.selectedPhysicianId || !this.selectedPhysician) {
            this.showToast("Input missing", "Please select a physician first", "error");
            return;
        }
        if(!this.selectedPhysician.Email) {
            this.showToast("Input missing", "Email missing, please populate email in physician record", "error");
            return;
        }
        this.isSpinnerLoading = true;
        sendCalendarRequestAccess({ physician: this.selectedPhysician })
        .then((result) => {
            this.isSpinnerLoading = false;
            this.showToast("Success!", "Calendar access request email sent to physician", "success");
            this.refreshPage();
        })
        .catch((error) => {
            this.isSpinnerLoading = false;
            this.showToast("ERROR", "Error in sending calendar access request, please contact admin", "error");
        });
    }
    
    handleSlotSelection(event) {
        this.selectedAppointmentSlot = event.detail.selectedRows ? event.detail.selectedRows[0].appointmentNum : undefined;
        this.selectedSlotObj = this.findSelectedSlot(this.selectedAppointmentSlot);        
    }

    findSelectedSlot(selectedSlotNum) {  
        if(!selectedSlotNum && !this.availableSlots) {
            return;            
        }        
        const index = this.availableSlots.findIndex(slot => slot.appointmentNum ===selectedSlotNum);
        return this.availableSlots[index];                        
    }

    handleSaveAppointment() {
        if(!this.selectedAppointmentSlot && !this.selectedSlotObj) {
            this.showToast("Input missing", "Please select an appointment slot", "error");
            return;
        }
        this.isSpinnerLoading = true;

        const payload = {            
            title: 'Medical Clinic Appointment',
            startTimeStr: new Date(this.selectedSlotObj.startTime).toISOString(),            
            endTimeStr: new Date(this.selectedSlotObj.endTime).toISOString(),
            physicianId: this.selectedPhysicianId,
            physicianEmail: this.selectedPhysician.Email,
            patientId: this.selectedPatientId            
        };
        //console.log('payload JSON='+JSON.stringify(payload));
        
        createEvent({ cItem: payload })
        .then((result) => {
            this.isSpinnerLoading = false;
            this.showToast("Success!", "Appointment booked in google calendar and Salesforce", "success");
            this.resetAppointmentSelection();
            this.refreshPage(); 
                  
        })
        .catch((error) => {
            this.isSpinnerLoading = false;
            this.showToast("ERROR", "Error in creating event, please contact admin", "error");
            //console.log('error JSON='+JSON.stringify(error));
            //console.log('error='+error);
        });
        this.openModal = false;   
    }

    resetAppointmentSelection() {
        this.showAppointmentSlots = false;
        this.availableSlots = undefined;
        this.selectedAppointmentSlot = undefined;
        this.selectedSlotObj = undefined;        
    }
    
    get appointmentTableColumns() {
        return [
            { label: "Start Date/Time",fieldName: "startTime", type:"date",
                typeAttributes:
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone:"UTC"
                }
            },
            { label: "End Date/Time", fieldName: "endTime",type:"date",
                typeAttributes:
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone:"UTC"
                } 
            }            
          //  { label: "Appointment No.", fieldName: "appointmentNum" },            
        ];
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

    refreshPage(event){
        eval("$A.get('e.force:refreshView').fire();");
    }
    closeModal() {
        this.openModal = false;
    }

}