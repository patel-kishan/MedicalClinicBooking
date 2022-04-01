public with sharing class GoogleWebService {
    public static Http http = new Http();
    public static HTTPResponse response;
    public static HttpRequest request;

    @AuraEnabled
    public static String getCalendarEvents(String calendarId, Date inpDate) {
        request = new HttpRequest();
        request.setMethod('GET');
        
        String queryParams = '?orderBy=startTime&singleEvents=true&timeMin='+ GoogleIntegrationUtility.calculateTimeMin(inpDate) +'&timeMax='+GoogleIntegrationUtility.calculateTimeMax(inpDate);
        request.setEndpoint('callout:Google_API/calendar/v3/calendars/' + calendarId + '/events' + queryParams);

        response = http.send(request);
        if (response.getStatusCode() == 404) {
            return 'no_access';
        }
        return response.getBody();
    }
	
    @AuraEnabled
    public static String createEvent(GoogleIntegrationUtility.CalendarItem cItem) {
        request = new HttpRequest();
        request.setMethod('POST');
        request.setEndpoint('callout:Google_API/calendar/v3/calendars/'+cItem.physicianEmail+'/events?sendUpdates=all');
        
        
        
        String body = GoogleIntegrationUtility.getRequestBody(cItem);
        request.setBody(body);
        
        response = http.send(request);
        if (response.getStatusCode() != 200) {
            return 'Error';
        }
        
        String calendarEventId = GoogleIntegrationUtility.getCalendarEventId(response.getBody());
        cItem.gCalEvtId = calendarEventId;
        
        
        //Create appointment record in Salesforce
        String recordId = GoogleIntegrationUtility.createAppointmentInSF(cItem);
        return 'Success'+recordId;
		
    }
    
    public static String getCalendarEventId(String response) {
        String calendarEventId = '';
        JSONParser parser = JSON.createParser(response);
        while (parser.nextToken() != null) {
            if ((parser.getCurrentToken() == JSONToken.FIELD_NAME) && (parser.getText() == 'id')) {                
                parser.nextToken();                
                calendarEventId = parser.getText();
            }
        }
        return calendarEventId;
    }
}