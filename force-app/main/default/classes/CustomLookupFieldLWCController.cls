public with sharing class CustomLookupFieldLWCController {
    @AuraEnabled(cacheable=true)
    public static List<SObject> searchRecords(String searchTerm, string objectApiName, String filter) {
        String query = null;

        if (filter != null && filter != '') {
            if (searchTerm == null || searchTerm == '') {
                query = 'SELECT Id, Name FROM ' + objectApiName + ' WHERE ' + filter + ' ORDER BY LastViewedDate DESC';
            } else {
                query = 'SELECT Id, Name FROM ' + objectApiName + ' WHERE Name Like  \'%' + searchTerm + '%\' AND ' + filter + ' ORDER BY LastViewedDate DESC';
            }
        } else {
            if (searchTerm == null || searchTerm == '') {
                query = 'SELECT Id, Name FROM ' + objectApiName + ' ORDER BY LastViewedDate DESC';
            } else {
                query = 'SELECT Id, Name FROM ' + objectApiName + ' WHERE Name Like  \'%' + searchTerm + '%\' ORDER BY LastViewedDate DESC';
            }
        }

        System.debug(query);
        List<SObject> records = database.query(query);

        return records;
    }
}