public class SearchPatientController {

    @AuraEnabled(cacheable=true)
    public static List<Contact> searchPatients(String contactId) {
        if (contactId != null || contactId != '') {
            return [
                SELECT Id, Name,Gender__c, Phone, Email
                FROM Contact
                WHERE Id =:contactId
                WITH SECURITY_ENFORCED
            ];  
        }
        
        return null;
    }
}