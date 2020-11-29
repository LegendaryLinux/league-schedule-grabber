# league-schedule-grabber
A quick program designed to grab schedule listing from the 
[Z3R League Schedule](http://speedgaming.org/alttprleague/crew/) and write them to
a text file for use in OBS (Open Broadcaster Software).

### Usage
You may simply run the executable to have it retrieve the next available race information.

If you wish to retrieve information beyond the first race, you may provide an argument to
the executable like so:

```shell script
league-schedule-grabber.exe 5
```
The above command will retrieve teh 5th row from the table on the website.