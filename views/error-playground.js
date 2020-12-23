const sum = (a, b) => {
    if (a && b) {
      return a + b;
    }
    throw new Error('Invalid arguments');
  };
  
  try {
    console.log(sum(1));
  } catch (error) {
    console.log('Error occurred!'); //catch block handles error and therefore error occured and this works gets displayed
  //   console.log(error);
  }
  
  // console.log(sum(1));    //if we wrote only this and no try-catch block then server crashes.
  console.log('This works!');
  