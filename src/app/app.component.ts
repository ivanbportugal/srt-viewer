import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FileDropDirective } from 'angular2-file-drop';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  directives: [ FileDropDirective ]
})
export class AppComponent {
    @Input() title: string = 'Welcome to the simple SRT viewer';
    @Output() titleChange: EventEmitter<string> = new EventEmitter<string>();

    @Input() clock: string = '';
    @Output() clockChange: EventEmitter<string> = new EventEmitter<string>();

    public fileIsOver: boolean = false;
    private file: File;
    private allData = [];

    private noUiSlider = window['noUiSlider'];
    private moment = window['moment'];

    private slider;
    private isPlaying = false;
    private currInterval;
    private beginningOfDay;
    private startingPoint = 0;
    
    constructor() {
        setTimeout(() => {
            this.title = 'Drop an SRT File on the top drop zone area...';
            this.titleChange.emit(this.title);
        }, 3000);
    }

    public fileOver(fileIsOver: boolean): void {
        this.fileIsOver = fileIsOver;
    }

    public onFileDrop(file: File): void {
        if(file) {
            var self = this;
            var r = new FileReader();
            r.onload = function(e) {
                var contents = e.target['result'];
                self.processFile(contents);
                self.setupSlider();
            }
            r.readAsText(file);
            console.log('Got file "' + file.name + '"');
        }
    }

    processFile(contents: string) {
        var contentsArray = contents.split('\n');
        var dataToAdd = {};
        var currLine = 0;
        for(var i = 0; i < contentsArray.length; i++) {
            var line = contentsArray[i];
            if(line.length < 2) {
                // Reset to next subtitle entry
                currLine = 0;
                this.allData.push(dataToAdd);
                dataToAdd = {};
                continue;
            }
            if(currLine == 0) {
                // Line number
                dataToAdd['number'] = line;
            } else if(currLine == 1) {
                // Time
                dataToAdd['time'] = line;
            } else if(currLine > 1) {
                // Subtitle Text
                if(!dataToAdd['text']) {
                    dataToAdd['text'] = line;
                } else {
                    dataToAdd['text'] += ('\n' + line);
                }
            }
            currLine++;
        }

        // All done processing
        console.log('Done processing ' + this.allData.length + ' subtitle entries.');
    }

    setupSlider() {
        // 00:03:42,600 --> 00:03:45,400
        var lastItemTime = this.allData[this.allData.length - 1]['time'];
        var lastDate = this.moment(lastItemTime.split('-->')[1], 'HH:mm:ss,SSS');
        this.beginningOfDay = this.moment(lastDate);
        this.beginningOfDay.startOf('day');
        var duration = lastDate.diff(this.beginningOfDay);
        this.title = 'Movie Runtime: ' + lastDate.format('HH:mm:ss');
        this.titleChange.emit(this.title);
        var self = this;

        this.slider = document.getElementById('slider');
        this.noUiSlider.create(this.slider, {
            start: [0],
            range: {
                'min': 0,
                'max': duration
            }
        });

        this.slider['noUiSlider'].on('start', function(){
            // from drag start
            self.stopPlaying();
        });

        this.slider['noUiSlider'].on('slide', function(){
            // from dragging
            self.stopPlaying();
        });

        this.slider['noUiSlider'].on('set', function(){
            // from playback
            self.stopPlaying();
            if(self.isPlaying) {
                self.beginPlaying();
            }
        });
    }

    togglePlayback() {
        if(!this.slider) {
            console.log('Need file to play from');
            return;
        }
        this.stopPlaying();
        this.isPlaying = !this.isPlaying;
        if(this.isPlaying) {
            this.beginPlaying();
        } else {
            this.stopPlaying();
        }
    }

    beginPlaying() {
        var self = this;
        var newPosition = +this.slider['noUiSlider'].get();
        this.currInterval = setInterval(function() {
            // Animate the slider position
            newPosition += 100;
            self.slider['noUiSlider'].set(newPosition);
            self.emitCaption(newPosition);
        }, 100);
    }

    stopPlaying() {
        clearInterval(this.currInterval);
    }

    emitCaption(position: number) {
        var beginDayCopy = this.moment(this.beginningOfDay);
        this.clock = beginDayCopy.add(position, 'ms').format('HH:mm:ss');
        this.clockChange.emit(this.clock);

        for (var i = this.startingPoint; i < this.allData.length; ++i) {
            var element = this.allData[i];
            var times = element.time.split('-->');
            
            // e.g. 00:03:42,600 --> 00:03:45,400
            var beginTime = this.moment(times[0], 'HH:mm:ss,SSS');
            var endTime = this.moment(times[1], 'HH:mm:ss,SSS');

            var beginInterval = beginTime.diff(this.beginningOfDay);
            var endInterval = endTime.diff(this.beginningOfDay);

            if(position < beginInterval) {
                // nothing to loop through, since we're before the first caption
                break;
            }
            if(position >= beginInterval && position <= endInterval) {
                // Finally, diff and emit!
                this.title = element.text;
                this.titleChange.emit(this.title);
                this.startingPoint = i;
                break;
            }
        }
    }
}

