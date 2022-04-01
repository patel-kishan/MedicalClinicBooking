public class GoogleIntegrationUtility {
    
    public static String formatTimeString(String timeStr) {
        return timeStr.replace('T', ' ');
    }
    
    public static Time getBusinessStartTimeGMT() {
        Time businessStartTime = Time.newInstance(9, 0, 0, 0);
        return businessStartTime;
    }
    
    public static Time getBusinessEndTimeGMT() {
        Time businessEndTime = Time.newInstance(19, 0, 0, 0);
        return businessEndTime;
    }    
    
    public static String calculateTimeMin(Date inpDate) {
        String result = '';
        Date inputDate = (inpDate!=null && inpDate>=System.today()) ? inpDate : System.today();		
        Time businessStartTime = getBusinessStartTimeGMT();
        DateTime timeMinDate = DateTime.newInstance(inputDate, businessStartTime);
        String timeStr = String.valueOf(timeMinDate);
        result = timeStr.replace(' ', 'T') + 'Z';                        
        return result;
    }
    
    public static String calculateTimeMax(Date inpDate) {
        String result = '';
        Date inputDate = (inpDate!=null && inpDate>=System.today()) ? inpDate : System.today();		
        Time businessEndTime = getBusinessEndTimeGMT();
        DateTime timeMaxDate = DateTime.newInstance(inputDate, businessEndTime);
        String timeStr = String.valueOf(timeMaxDate);
        result = timeStr.replace(' ', 'T') + 'Z';         
        return result;
    }
    
    public static Time calculateTimeInstanceToday() {        
        Time currentTime = Datetime.now().time();
        Time businessStartTime = getBusinessStartTimeGMT();
        Time businessEndTime = getBusinessEndTimeGMT();        
        
        Time result = Time.newInstance((businessStartTime.hour()), 0, 0, 0);
        
        if(currentTime >= businessStartTime) {
            result = Time.newInstance((currentTime.hour()+1), 0, 0, 0);
        }
        else if(currentTime < businessStartTime) {
            result = Time.newInstance((businessStartTime.hour()), 0, 0, 0);
        }
        return result;
    }
    
    public static List<GoogleIntegrationUtility.CalendarItem> parseCalendarEventResponse(String apiResponse) {
        List<GoogleIntegrationUtility.CalendarItem> currentEventsList = new List<GoogleIntegrationUtility.CalendarItem>(); 
        Map<String, Object> m = (Map<String, Object>)JSON.deserializeUntyped(apiResponse);
        List<Object> itemsList = m.containsKey('items') ? (List<Object>)m.get('items') : new List<Object>();        
        for(Object item:itemsList) {
            GoogleIntegrationUtility.CalendarItem gci=new GoogleIntegrationUtility.CalendarItem(); 
            Map<String, Object> itemMap = (Map<String, Object>)item;
            for(String key: itemMap.keySet()) {        
                if(key.equalsIgnoreCase('start')) {
                    Map<String, Object> itemInnerMapStart = (Map<String, Object>)itemMap.get(key);           
                    gci.startTimeStr = (String)itemInnerMapStart.get('dateTime');                
                    gci.sourceTimeZone = (String)itemInnerMapStart.get('timeZone');
                }
                if(key.equalsIgnoreCase('end')) {
                    Map<String, Object> itemInnerMapEnd = (Map<String, Object>)itemMap.get(key);
                    gci.endTimeStr = (String)itemInnerMapEnd.get('dateTime');
                }        
            }
            currentEventsList.add(gci);
        }
        return currentEventsList;
    }
    
    public static List<GoogleIntegrationUtility.CalendarItem> createAvailableCalendarSlots(List<GoogleIntegrationUtility.CalendarItem> bookedSlots, Date inpDate) {        
        List<GoogleIntegrationUtility.CalendarItem> availableSlots = new List<GoogleIntegrationUtility.CalendarItem>();
        Integer slotDurationLocal = 30;
        Time startTimeLocal = GoogleIntegrationUtility.getBusinessStartTimeGMT();
    	Time endTimeLocal = GoogleIntegrationUtility.getBusinessEndTimeGMT();
        Time timeCounter = inpDate!=null && inpDate > System.today() ? startTimeLocal : calculateTimeInstanceToday();
        Integer num=1;
        for(Time timeVal=timeCounter; timeVal < endTimeLocal; timeVal=timeVal.addMinutes(slotDurationLocal)) {            
            //System.debug('----SLOT CREATE INFO----');
            //System.debug('timeVal='+timeVal);
            CalendarItem slot = new CalendarItem();
            slot.appointmentNum = num;
            slot.startTime = DateTime.newInstance(inpDate, timeVal);
            slot.endTime = DateTime.newInstance(inpDate, timeVal.addMinutes(slotDurationLocal));
            Boolean isSlotBooked = GoogleIntegrationUtility.checkIfSlotBooked(bookedSlots,slot);
            if(!isSlotBooked) {
                availableSlots.add(slot);
            }
            num++;
        }
        return availableSlots;        
    }
    
    public static Boolean checkIfSlotBooked(List<GoogleIntegrationUtility.CalendarItem> bookedSlots, GoogleIntegrationUtility.CalendarItem currentSlot) {
        Boolean result = false;
        if(currentSlot!=null && currentSlot.startTime!=null && currentSlot.endTime!=null) {            
            for(GoogleIntegrationUtility.CalendarItem bookedSlot: bookedSlots) {
				Boolean isPreviousSlot = currentSlot.startTime > bookedSlot.startTime;
                Boolean isAfterSlot = currentSlot.startTime < bookedSlot.startTime;
                Boolean isSameSlot = currentSlot.startTime==bookedSlot.startTime;
                Boolean isAvailableSlot = (!isSameSlot && isPreviousSlot && bookedSlot.endTime<=currentSlot.startTime) || (!isSameSlot && isAfterSlot && currentSlot.endTime<=bookedSlot.startTime);
                if(!isAvailableSlot) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }
    
    public static String getRequestBody(GoogleIntegrationUtility.CalendarItem calItem) {
        String body = '';
        if (calItem.endTimeStr!=null) {
            body += '{"end":{"dateTime":"' + calItem.endTimeStr + '"}';
        }
        if (calItem.startTimeStr!=null) {
            if (String.isNotBlank(body)) {
                body += ',';
            } else {
                body += '{';
            }
            body += '"start":{"dateTime":"' + calItem.startTimeStr + '"}';
        }
        if (String.isNotBlank(calItem.title)) {
            if (String.isNotBlank(body)) {
                body += ',';
            } else {
                body += '{';
            }
            body += '"summary":"' + calItem.title + '"';
        }        
        if (String.isNotBlank(body)) {
            body += '}';
        } else {
            body += '{}';
        }
        return body;
    }
    
    public static String getCalendarEventId(String response) {
        String calEventId = '';
        JSONParser parser = JSON.createParser(response);
        while (parser.nextToken() != null) {
            if ((parser.getCurrentToken() == JSONToken.FIELD_NAME) && (parser.getText() == 'id')) {
                parser.nextToken();
                calEventId = parser.getText();
            }
        }
        return calEventId;
    }
    
    public static String createAppointmentInSF(GoogleIntegrationUtility.CalendarItem calItem) {
        
        // insert appointment recodrd
        Appointment__c appointment = new Appointment__c(
            Physician__c = calItem.physicianId,
            Patient__c = calItem.patientId,
            Appointment_Date__c = calItem.startTime.dateGMT(),
            Start_Time__c = calItem.startTime.timeGMT(),
            End_Time__c = calItem.endTime.timeGMT(),
            Calendar_Event_Id__c = calItem.gCalEvtId
        );
        insert appointment;
        return appointment.Id;		
    }
    
    public class CalendarItem {
        @AuraEnabled
        public String startTimeStr {get;set;}
        @AuraEnabled
        public String endTimeStr {get;set;}
        
        @AuraEnabled
        public Datetime startTime {
            get {
                if(String.isNotBlank(startTimeStr)) {
                    startTime = Datetime.valueOfGmt(GoogleIntegrationUtility.formatTimeString(startTimeStr));                    
                }
                return startTime;
            }
            set;
        }
        @AuraEnabled
        public Datetime endTime {
            get {
                if(String.isNotBlank(endTimeStr)) {
                    endTime = Datetime.valueOfGmt(GoogleIntegrationUtility.formatTimeString(endTimeStr));
                }
                return endTime;
            }
            set;
        }        
        @AuraEnabled
        public Integer appointmentNum;
        @AuraEnabled
        public String title {get;set;}
        @AuraEnabled
        public String physicianEmail {get;set;}
        @AuraEnabled
        public String physicianId {get;set;}
        @AuraEnabled
        public String patientId {get;set;}
        @AuraEnabled
        public String gCalEvtId {get;set;}
        public String sourceTimeZone;
        public Date appDate {
            get {
                if(startTime!=null) {
                    appDate = Date.valueOf(startTime);
                }
                return appDate;
            }
            set;
        }
    }
    
}