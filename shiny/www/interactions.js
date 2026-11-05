document.addEventListener('click',function(event){
  var button=event.target.closest('button[data-inspect-code]');
  if(!button||!window.Shiny)return;
  Shiny.setInputValue(button.dataset.target||'inspect_code',button.dataset.inspectCode,{priority:'event'});
});
document.addEventListener('mousemove',function(event){
  var tip=document.getElementById('hover_tip');if(!tip)return;
  if(!event.target.closest('#scatter')){tip.style.display='none';return;}
  tip.style.left=Math.min(event.clientX+16,window.innerWidth-290)+'px';
  tip.style.top=Math.max(12,Math.min(event.clientY+16,window.innerHeight-210))+'px';
  tip.style.display='block';
});
