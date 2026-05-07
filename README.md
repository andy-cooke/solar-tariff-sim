# solar-tariff-sim
Simulates Solar and Battery Setups against Tariffs

Basic web page form with settings to input details.
Will run for each day a half-hourly simulation of electric energy produced, consumer, stored or fed back into grid
Compares this against tariffs to calculate costs per hour or per day
Saves the data extracted and past sessions into local storage 5MB or 10MB available - is this enough for full smart history? Seems pretty big for CSV

Aims:
- Set typical day base load / spike
- Set number of panels/size on inverter/size of battery
- Gets smart meter history from Octopus API
- Gets Octopus Tariff details
- Gets Octopus Agile History
- Gets real world samples of energy produced per solar panel for that day which reflects real world weather
