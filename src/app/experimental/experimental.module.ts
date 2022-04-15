import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentalComponent } from './experimental.component';



@NgModule({
  declarations: [
    ExperimentalComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [ExperimentalComponent],
})
export class ExperimentalModule { }
