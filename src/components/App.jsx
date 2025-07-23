// Monitor for initial UAV position set
  useEffect(() => {
    // Remove this duplicate subscription since we already handle it above
    // This was causing the infinite loop
  }, []);