public class FillAppointmentDetailsController {
    
    @AuraEnabled(cacheable=true)
    public static List<Specialization__c> getSpecializations(){
        List<Specialization__c> listSpecializations=[Select Id, Name, Appointment_Price__c from Specialization__c];
        return listSpecializations;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Contact> getPhysiciansForSpecialization(String specId) {
        Id physicianRecTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByName().get('Physician').getRecordTypeId();
        List<Contact> result = [
            SELECT Id, Name, Gender__c, Specialization__c, Phone, Email, Calendar_Access_Requests__c
            FROM Contact
            WHERE RecordTypeId =:physicianRecTypeId AND Specialization__c=:specId AND OnDuty__c=true
            WITH SECURITY_ENFORCED
        ];
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static List<GoogleIntegrationUtility.CalendarItem> getAvailableSlots(String apiResponse, Date inpDate) {
        List<GoogleIntegrationUtility.CalendarItem> bookedAppointments = GoogleIntegrationUtility.parseCalendarEventResponse(apiResponse);
        List<GoogleIntegrationUtility.CalendarItem> openSlots = GoogleIntegrationUtility.createAvailableCalendarSlots(bookedAppointments, inpDate);        
        return openSlots;
    }

    @AuraEnabled
    public static Contact sendCalendarRequestAccess(Contact physician) {
        Contact physicianToUpdate;
        if(physician!=null && physician.Id!=null) {
            physicianToUpdate = new Contact(Id=physician.Id);
            physicianToUpdate.Calendar_Access_Requests__c = (physician.Calendar_Access_Requests__c!=null && physician.Calendar_Access_Requests__c > 0) ? (physician.Calendar_Access_Requests__c + 1) : 1 ;
            update physicianToUpdate;
        }
        return physicianToUpdate;
    }
}