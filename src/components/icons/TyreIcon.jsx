const TyreIcon = ({ size = 24, className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    {/* Bold outer tire ring */}                                                                                                                                                                                                 
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />         

      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /> 
       {/* Inner rim edge */}                                                                                                                                                                                                       
         <circle cx="12" cy="12" r="7" stroke="currentColor"  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />         
         <circle cx="12" cy="12" r="3" stroke="currentColor"  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> 


         {/* 8 rim bolts — outside the rim, between inner rim and outer ring */}                                                                                                                                                      
         <circle cx="12" cy="7" r="0.7" fill="currentColor" />                                                                                                                                                                      
         <circle cx="12" cy="17" r="0.7" fill="currentColor" />                                                                                                                                                                  
         <circle cx="7" cy="12" r="0.7" fill="currentColor" />                                                                                                                                                                  
         <circle cx="17" cy="12" r="0.7" fill="currentColor" />                                                                                                                                                                     
         <circle cx="15.6" cy="15.6" r="0.7" fill="currentColor" />                                                                                                                                                                 
         <circle cx="8.5" cy="15.6" r="0.7" fill="currentColor" />                                                                                                                                                                 
         <circle cx="8.5" cy="8.5" r="0.7" fill="currentColor" />                                                                                                                                                                     
         <circle cx="15.6" cy="8.5" r="0.7" fill="currentColor" />                                                                                                                                                                  
       </svg>         
);

export default TyreIcon;
