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
    @Input() title: string = 'app works!';
    @Output() titleChange: EventEmitter<string> = new EventEmitter<string>();
    public fileIsOver: boolean = false;
    private file: File;
    private allData = [];
    
    constructor() {
        setTimeout(() => {
            this.title = 'still works';
            this.titleChange.emit(this.title);
        }, 1000);
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
            }
            r.readAsText(file);
            console.log('Got file "' + file.name + '"');
        }
    }

    togglePlayback() {
        console.log('clicked');
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
}

